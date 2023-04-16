import * as React from 'react';
import { Helmet } from 'react-helmet-async';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Auth, Hub, Amplify, Analytics } from 'aws-amplify';

import configJson from 'config.json';
import configLocalJson from 'config_local.json';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { appActions, useAppSlice } from 'app/slices/app';
import {
  selectAuthState,
  selectIsUserSignedIn,
  selectSnackbarNotification,
} from 'app/slices/app/selectors';
import { AuthState } from 'app/slices/app/types';
import NotificationSnackbar from 'app/components/NotificationSnackbar';
import GlobalStyles from '@mui/material/GlobalStyles';
import { AppDrawer } from './components/AppDrawer';
import { Homepage } from './pages/Homepage/Loadable';
import { LineDetailPage } from './pages/Line/LineDetailPage/Loadable';
import { CreateLinePage } from './pages/Create/Line/Loadable';
import { CreateGuidePage } from './pages/Create/Guide/Loadable';
import { LineEditPage } from './pages/Line/LineEditPage/Loadable';
import { SpotDetailPage } from './pages/Spot/SpotDetailPage/Loadable';
import { CreateSpotPage } from './pages/Create/Spot/Loadable';
import { SpotEditPage } from './pages/Spot/SpotEditPage/Loadable';
import { CommunitiesPage } from './pages/Communities/Loadable';
import { GuideDetailPage } from './pages/Guide/GuideDetailPage/Loadable';
import { GuideEditPage } from './pages/Guide/GuideEditPage/Loadable';
import { LegacyDetailPage } from './pages/LegacyDetailPage/Loadable';

export function App() {
  useAppSlice();

  const dispatch = useDispatch();

  const authState = useSelector(selectAuthState);
  const isSignedIn = useSelector(selectIsUserSignedIn);

  const snackbarNotification = useSelector(selectSnackbarNotification);

  useEffect(() => {
    const amplifyConfig =
      process.env.NODE_ENV === 'development'
        ? configLocalJson.AWS.Amplify
        : configJson.AWS.Amplify;

    Amplify.configure(amplifyConfig);
    Analytics.autoTrack('pageView', {
      enable: true,
      type: 'SPA',
      getUrl: () => {
        let path = window.location.pathname as string;
        const origin = window.location.origin;
        if (path.includes('/line')) {
          path = '/line';
        }
        if (path.includes('/spot')) {
          path = '/spot';
        }
        if (path.includes('/guide')) {
          path = '/guide';
        }
        if (path.includes('/x/')) {
          path = '/legacy';
        }
        return origin + path;
      },
    });

    Hub.listen('auth', async ({ payload: { event, data } }) => {
      switch (event) {
        case 'signIn':
          dispatch(appActions.updateAuthState(AuthState.SignedIn));
          break;
        case 'signOut':
          dispatch(appActions.updateAuthState(AuthState.SignedOut));
          break;

        default:
          break;
      }
    });
    Auth.currentAuthenticatedUser()
      .then(async data => {
        dispatch(appActions.updateAuthState(AuthState.SignedIn));
      })
      .catch(() => dispatch(appActions.updateAuthState(AuthState.SigningOut)));
  }, [dispatch]);

  useEffect(() => {
    if (authState === AuthState.SignedIn) {
      Auth.currentUserInfo()
        .then(data => {
          const identityType: UserIdentityType =
            data.attributes['custom:identityType'] || 'individual';
          dispatch(appActions.updateIdentityType(identityType));
        })
        .catch(err => {
          dispatch(appActions.updateAuthState(AuthState.SigningOut));
        });
    } else if (authState === AuthState.SigningOut) {
      Auth.signOut();
    }
  }, [authState, dispatch]);

  const onSnackbarClose = () => {
    dispatch(appActions.updateSnackbarNotification(null));
  };

  return (
    <BrowserRouter>
      <Helmet>
        <meta name="description" content="SlackMap" />
      </Helmet>
      <GlobalStyles
        styles={{
          body: { fontFamily: 'Inter', height: '100%', width: '100%' },
        }}
      />
      <AppDrawer>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/communities" element={<CommunitiesPage />} />
          <Route path="/line/:lineId" element={<LineDetailPage />} />
          <Route path="/spot/:spotId" element={<SpotDetailPage />} />
          <Route path="/guide/:guideId" element={<GuideDetailPage />} />
          {isSignedIn && (
            <>
              <Route path="/create/line" element={<CreateLinePage />} />
              <Route path="/line/:lineId/edit" element={<LineEditPage />} />
              <Route path="/create/spot" element={<CreateSpotPage />} />
              <Route path="/spot/:spotId/edit" element={<SpotEditPage />} />
              <Route path="/create/guide" element={<CreateGuidePage />} />
              <Route path="/guide/:guideId/edit" element={<GuideEditPage />} />
            </>
          )}
          <Route path="/x/:legacyId" element={<LegacyDetailPage />} />
          <Route path="*" element={<Homepage />} />
        </Routes>
      </AppDrawer>

      <NotificationSnackbar
        snackbarNotification={snackbarNotification}
        onClose={onSnackbarClose}
      />
    </BrowserRouter>
  );
}
