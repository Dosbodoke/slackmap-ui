import * as React from 'react';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import {
  Map as ReactMapGL,
  Source,
  Layer,
  MapLayerMouseEvent,
  GeolocateControl,
  AttributionControl,
  ScaleControl,
  NavigationControl,
  Popup,
  MapboxGeoJSONFeature,
  ViewStateChangeEvent,
  ViewState,
  PopupProps,
} from 'react-map-gl';
import type { Point, Position } from 'geojson';
import type { MapRef } from 'react-map-gl';
import {
  unclusteredPointLayer,
  lineLayer,
  lineLabelLayer,
  polygonLayer,
  clusterLayer,
  polygonLabelLayer,
  isMouseHoverableLayer,
} from './layers';
import { useMapStyle } from './useMapStyle';
import { MapImage } from './Components/MapImage';
import {
  defaultMapSettings,
  defaultMapViewState,
  MAPBOX_TOKEN,
} from './constants';
import { MapLogo } from './Components/Logo';
import { MapLoadingPlaceholder } from './Components/MapLoadingPlaceholder';
import { CustomPopup } from './Components/Popups/CustomPopup';
import { LegendMenuItem, MapLegend } from './Components/MapLegend';
import { SlacklineMapSources } from './sources';
import {
  useHoveredFeature,
  useLegendMenu,
  useMapEvents,
  useSelectedFeature,
  useZoomToUserLocationOnMapLoad,
} from './mapHooks';
import {
  calculateBounds,
  parseMapFeature,
  pointsGeoJsonDict,
} from './mapUtils';
import { Box } from '@mui/system';

interface Props {
  onMapMoveEnd?: (event: ViewStateChangeEvent) => void;
  initialViewState?: Partial<ViewState>;
  popup?: React.ReactNode;
  onSelectedFeatureChange?: (feature?: MapboxGeoJSONFeature) => void;
}

export const SlacklineMap = (props: Props) => {
  const mapRef = useRef<MapRef>(null);
  const [zoomLevel, setZoomLevel] = useState(props.initialViewState?.zoom);
  const { mapStyle, projection } = useMapStyle(zoomLevel);
  const [popupLocation, setPopupLocation] = useState<Position>();

  const { legendMenu, legendValues, onLegendItemsUpdated } = useLegendMenu({
    lines: { label: 'Lines', isSelected: true },
    spots: { label: 'Spots', isSelected: true },
  });

  const setHoveredFeature = useHoveredFeature(mapRef);
  const setSelectedFeature = useSelectedFeature(mapRef);
  const {
    isMapLoaded,
    onMapLoad,
    onSourceData,
    onMouseMove,
    onMapClick,
    cursor,
  } = useMapEvents(mapRef, {
    clusterSourceId: 'slacklineMapCluster',
    onMouseMovedToFeature(feature) {
      if (isMouseHoverableLayer(feature.layer.id)) {
        setHoveredFeature(feature);
      }
    },
    onMouseMovedToVoid() {
      setHoveredFeature(undefined);
    },
    onClickedToFeature(feature) {
      if (feature.layer.id === unclusteredPointLayer.id) {
        const pointFeature = pointsGeoJsonDict[feature.properties?.id];
        if (pointFeature) {
          const { marginedBounds } = calculateBounds(
            pointFeature.geometry,
            parseFloat(feature.properties?.l),
          );
          mapRef.current?.fitBounds(marginedBounds);
        }
      } else if (isMouseHoverableLayer(feature.layer.id)) {
        setSelectedFeature(feature);
        const { center } = parseMapFeature(feature);
        setPopupLocation(center);
        props.onSelectedFeatureChange?.(feature);
      }
    },
    onClickedToVoid() {
      setSelectedFeature(undefined);
      setPopupLocation(undefined);
      props.onSelectedFeatureChange?.(undefined);
    },
  });

  useZoomToUserLocationOnMapLoad(
    mapRef,
    isMapLoaded && !props.initialViewState,
  );

  const onPopupClose = () => {
    setPopupLocation(undefined);
    mapRef.current?.easeTo({
      padding: { top: 0, left: 0, bottom: 0, right: 0 },
    });
  };

  return (
    <>
      {!isMapLoaded && <MapLoadingPlaceholder />}
      <MapLogo />
      <MapLegend menu={legendMenu} onItemsUpdated={onLegendItemsUpdated} />
      <ReactMapGL
        {...defaultMapSettings}
        initialViewState={props.initialViewState || defaultMapViewState}
        mapStyle={mapStyle}
        interactiveLayerIds={[
          lineLayer.id!,
          lineLabelLayer.id!,
          polygonLayer.id!,
          polygonLabelLayer.id!,
          unclusteredPointLayer.id!,
          clusterLayer.id!,
        ]}
        onLoad={onMapLoad}
        onSourceData={onSourceData}
        onClick={onMapClick}
        onMoveEnd={props.onMapMoveEnd}
        onMouseMove={onMouseMove}
        cursor={cursor}
        onZoom={e => {
          setZoomLevel(e.viewState.zoom);
        }}
        ref={mapRef}
        projection={projection}
      >
        <GeolocateControl />
        <AttributionControl
          compact
          customAttribution="International Slackline Association"
        />
        <ScaleControl />
        <NavigationControl />
        <MapImage name={'marker'} url={'/images/line-marker.png'} />
        {popupLocation && props.popup && (
          <CustomPopup
            key={popupLocation[0] + popupLocation[1]}
            longitude={popupLocation[0]}
            latitude={popupLocation[1]}
            anchor="left"
            onClose={onPopupClose}
            maxWidth="none"
          >
            {props.popup}
          </CustomPopup>
        )}
        <SlacklineMapSources options={legendValues} />
      </ReactMapGL>
    </>
  );
};
