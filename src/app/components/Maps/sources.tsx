import React, { useEffect } from 'react';
import { Source, Layer, useMap } from 'react-map-gl';
import { appColors } from 'styles/theme/colors';
import { geoJsonURL } from './constants';
import {
  clusterCountLayer,
  clusterLayer,
  lineLabelLayer,
  lineLayer,
  pointLayer,
  polygonLabelLayer,
  polygonLayer,
  polygonOutlineLayer,
  unclusteredPointLayer,
} from './layers';

export const SlacklineMapSources = (props: {
  options: {
    spots?: boolean;
    lines?: boolean;
    guides?: boolean;
  };
  disableClustering?: boolean;
  filterId?: string;
}) => {
  const { disableClustering, options, filterId } = props;
  let clusterGeoJsonUrl = '';
  const isJoinedClustering = options.lines && options.spots;

  if (!disableClustering) {
    if (options.lines && options.spots) {
      clusterGeoJsonUrl = geoJsonURL.clustersMain;
    } else if (options.spots) {
      clusterGeoJsonUrl = geoJsonURL.spotPoints;
    } else if (options.lines) {
      clusterGeoJsonUrl = geoJsonURL.linePoints;
    }
  }

  return (
    <>
      {clusterGeoJsonUrl && (
        <Source
          key={clusterGeoJsonUrl}
          id="slacklineMapCluster"
          type="geojson"
          data={clusterGeoJsonUrl}
          cluster={true}
          clusterMaxZoom={13}
          clusterMinPoints={3}
          clusterRadius={60}
          generateId={true}
          clusterProperties={
            isJoinedClustering
              ? undefined
              : {
                  ft: [
                    ['get', 'ft'],
                    ['get', 'ft'],
                  ],
                }
          }
        >
          <Layer {...clusterLayer} />
          <Layer {...clusterCountLayer} />
          <Layer {...unclusteredPointLayer} />
        </Source>
      )}

      <Source
        id="spots"
        type="geojson"
        data={geoJsonURL.spots}
        generateId={true}
        promoteId="id"
        filter={filterId ? ['!=', ['get', 'id'], filterId] : undefined}
      >
        <Layer
          {...polygonLayer}
          layout={{
            ...polygonLayer.layout,
            visibility: options.spots ? 'visible' : 'none',
          }}
        />
        <Layer
          {...polygonOutlineLayer}
          layout={{
            ...polygonOutlineLayer.layout,
            visibility: options.spots ? 'visible' : 'none',
          }}
        />
        <Layer
          {...polygonLabelLayer}
          layout={{
            ...polygonLabelLayer.layout,
            visibility: options.spots ? 'visible' : 'none',
          }}
        />
      </Source>

      <Source
        id="lines"
        type="geojson"
        data={geoJsonURL.lines}
        generateId
        promoteId="id"
        filter={filterId ? ['!=', ['get', 'id'], filterId] : undefined}
      >
        <Layer
          {...lineLayer}
          layout={{
            ...lineLayer.layout,
            visibility: options.lines ? 'visible' : 'none',
          }}
          // filter={['all', lineLayer.filter, ['!=', ['id'], excludeId || null]]}
        />
        <Layer
          {...lineLabelLayer}
          layout={{
            ...lineLabelLayer.layout,
            visibility: options.lines ? 'visible' : 'none',
          }}
          // filter={[
          //   'all',
          //   lineLabelLayer.filter,
          //   ['!=', ['id'], excludeId || null],
          // ]}
        />
      </Source>
    </>
  );
};

export const CommunityMapSources = (props: {
  options: {
    groups?: boolean;
    associations?: boolean;
  };
}) => {
  return (
    <>
      <Source
        id="communities"
        type="geojson"
        data={geoJsonURL.communities}
        generateId={true}
      >
        <Layer
          {...pointLayer}
          paint={{
            ...pointLayer!.paint,
            'circle-color': appColors.isaBlue,
          }}
        />
      </Source>
    </>
  );
};
