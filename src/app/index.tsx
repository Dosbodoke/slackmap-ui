import * as React from 'react';
import { Helmet } from 'react-helmet-async';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Auth, Hub, Amplify } from 'aws-amplify';

import configJson from 'config.json';
import configLocalJson from 'config_local.json';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { appActions, useAppSlice } from 'app/slices/app';
import {
  selectAuthState,
  selectSnackbarNotification,
} from 'app/slices/app/selectors';
import { AuthState } from 'app/slices/app/types';
import NotificationSnackbar from 'app/components/NotificationSnackbar';
import GlobalStyles from '@mui/material/GlobalStyles';
import { LoadingIndicator } from './components/LoadingIndicator';
import { Homepage } from './pages/Homepage/Loadable';

export function App() {
  useAppSlice();

  const dispatch = useDispatch();

  const authState = useSelector(selectAuthState);
  const snackbarNotification = useSelector(selectSnackbarNotification);

  useEffect(() => {
    const amplifyConfig =
      process.env.NODE_ENV === 'development'
        ? configLocalJson.AWS.Amplify
        : configJson.AWS.Amplify;

    Amplify.configure(amplifyConfig);
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
          const identityType: IdentityType =
            data.attributes['custom:identityType'] || 'individual';
          dispatch(appActions.updateIdentityType(identityType));
        })
        .catch(err => {
          dispatch(appActions.updateAuthState(AuthState.SigningOut));
        });
    } else if (authState === AuthState.SigningOut) {
      Auth.signOut();
    }
  }, [authState]);

  const extractCurrentPathAndSearch = () => {
    if (
      window.location.pathname &&
      window.location.pathname !== '' &&
      window.location.pathname !== '/'
    ) {
      return window.location.pathname + window.location.search;
    }
    return undefined;
  };

  const signInClicked = () => {
    dispatch(appActions.updateAuthState(AuthState.SigningIn));
    Auth.federatedSignIn();
  };

  const onSnackbarClose = () => {
    dispatch(appActions.updateSnackbarNotification(null));
  };
  const isLoading =
    authState === AuthState.Loading ||
    authState === AuthState.SigningIn ||
    authState === AuthState.SigningOut;

  return (
    <BrowserRouter>
      <Helmet>
        <meta name="description" content="SlackMap" />
      </Helmet>
      <GlobalStyles styles={{ body: { fontFamily: 'Inter' } }} />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="*" element={<Homepage />} />
      </Routes>

      <NotificationSnackbar
        snackbarNotification={snackbarNotification}
        onClose={onSnackbarClose}
      />
    </BrowserRouter>
  );
}