import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  Map as ReactMapGL,
  ScaleControl,
  MapboxGeoJSONFeature,
} from 'react-map-gl';
import type { MapRef } from 'react-map-gl';
import {
  isMouseHoverableLayer,
  lineLabelLayer,
  lineLayer,
  pointLabelLayer,
  pointLayer,
  polygonLayer,
} from './layers';
import { MapImage } from './Components/MapImage';
import { fitMapToGeoJson } from './mapUtils';
import { FeatureCollection } from '@turf/turf';
import {
  defaultMapSettings,
  defaultMapViewState,
  mapStyles,
} from './constants';
import { FocusedButton } from './Components/FocusButton';
import { MapLoadingPlaceholder } from './Components/MapLoadingPlaceholder';
import { SlacklineMapSources } from './sources';
import { MapLegend } from './Components/MapLegend';
import { useHoveredFeature, useLegendMenu, useMapEvents } from './mapHooks';

interface Props {
  geoJson?: FeatureCollection;
  onFeatureClick?: (feature: MapboxGeoJSONFeature) => void;
}

export const FocusedMap = (props: Props) => {
  const mapRef = useRef<MapRef>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const { legendMenu, legendValues, onLegendItemsUpdated } = useLegendMenu({
    lines: { label: 'Lines', isSelected: true },
    spots: { label: 'Spots', isSelected: true },
    guides: { label: 'Access Guides', isSelected: true },
  });

  const setHoveredFeature = useHoveredFeature(mapRef);
  // const setSelectedFeature = useSelectedFeature(mapRef);
  const { isMapLoaded, onMapLoad, onMouseMove, onMapClick, cursor } =
    useMapEvents(mapRef, {
      onMouseMovedToFeature(feature) {
        if (isMouseHoverableLayer(feature.layer.id)) {
          setHoveredFeature(feature);
        }
      },
      onMouseMovedToVoid() {
        setHoveredFeature(undefined);
      },
      onClickedToFeature(feature) {
        if (isMouseHoverableLayer(feature.layer.id)) {
          props.onFeatureClick?.(feature);
        }
      },
    });

  useEffect(() => {
    if (!isMapLoaded || !props.geoJson || !mapRef.current) return;
    fitMapToGeoJson(mapRef, props.geoJson);
    setIsMapReady(true);
    const geoJson = props.geoJson;
    for (const feature of geoJson.features) {
      if (feature.geometry.type === 'LineString') {
        mapRef.current?.setFeatureState(
          { id: feature.properties?.id, source: 'lines' },
          { isSelected: true },
        );
      }
      if (feature.geometry.type === 'Polygon') {
        mapRef.current?.setFeatureState(
          { id: feature.properties?.id, source: 'spots' },
          { isSelected: true },
        );
      }
    }
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const map = mapRef.current;
      for (const feature of geoJson.features) {
        if (feature.geometry.type === 'LineString') {
          map?.removeFeatureState(
            { id: feature.properties?.id, source: 'lines' },
            'isSelected',
          );
        }
        if (feature.geometry.type === 'Polygon') {
          map?.removeFeatureState(
            { id: feature.properties?.id, source: 'spots' },
            'isSelected',
          );
        }
      }
    };
  }, [isMapLoaded, props.geoJson]);

  const onFocusClick = () => {
    fitMapToGeoJson(mapRef, props.geoJson, { animate: true });
  };

  return (
    <>
      {!isMapReady && <MapLoadingPlaceholder />}
      <FocusedButton onFocusClick={onFocusClick} />
      <MapLegend menu={legendMenu} onItemsUpdated={onLegendItemsUpdated} />
      <ReactMapGL
        {...defaultMapSettings}
        initialViewState={defaultMapViewState}
        mapStyle={mapStyles.satelliteStreets}
        onLoad={onMapLoad}
        ref={mapRef}
        onMouseMove={onMouseMove}
        onClick={onMapClick}
        interactiveLayerIds={[
          pointLayer('guide').id,
          pointLabelLayer('guide').id,
          lineLayer('line').id,
          lineLayer('guide').id,
          lineLabelLayer('line').id,
          lineLabelLayer('guide').id,
          polygonLayer('spot').id,
          polygonLayer('guide').id,
        ]}
        cursor={cursor}
      >
        <ScaleControl />
        <MapImage name={'marker'} url={'/images/line-marker.png'} />
        <SlacklineMapSources options={legendValues} disableClustering />
      </ReactMapGL>
    </>
  );
};
