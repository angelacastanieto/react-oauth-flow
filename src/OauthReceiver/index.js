// @flow
import * as React from 'react';
import qs from 'qs';
import { buildURL } from '../utils';
import type { UrlParams } from '../types';

type RenderProps = {
  processing: boolean,
  state: ?UrlParams,
  error: ?Error,
};

type Props = {
  baseUrl: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string,
  location?: { search: string },
  querystring?: string,
  onAuthSuccess?: (
    accessToken: string,
    response: { [key: string]: any },
  ) => void,
  onAuthError?: (error: Error) => void,
  render?: RenderProps => React.Node,
  component?: React.ComponentType<RenderProps>,
  children?: RenderProps => React.Node,
};

type State = {
  processing: boolean,
  state: ?UrlParams,
  error: ?Error,
};

export class OauthReceiver extends React.Component<Props, State> {
  state = {
    processing: true,
    state: null,
    error: null,
  };

  componentDidMount() {
    this.getAuthorizationCode();
  }

  getAuthorizationCode = async () => {
    try {
      const {
        baseUrl,
        clientId,
        clientSecret,
        redirectUri,
        onAuthSuccess,
      } = this.props;

      const { error, error_description, code, state } = this.parseQuerystring();
      this.setState(() => ({ state }));

      if (error != null) {
        const err = new Error(error_description);
        throw err;
      }

      const url = buildURL(`${baseUrl}/oauth2/token`, {
        code,
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      });

      const res = await window.fetch(url, { method: 'POST' });
      const response = await res.json();
      const accessToken: string = response.access_token;

      if (typeof onAuthSuccess === 'function') {
        onAuthSuccess(accessToken, response);
      }

      this.setState(() => ({ processing: false }));
    } catch (error) {
      this.handleError(error);
    }
  };

  handleError = (error: Error) => {
    const { onAuthError } = this.props;

    this.setState(() => ({ error }));
    if (typeof onAuthError === 'function') {
      onAuthError(error);
    }
  };

  parseQuerystring = () => {
    const { location, querystring } = this.props;
    let search;

    if (location != null) {
      search = location.search; // eslint-disable-line
    } else if (querystring != null) {
      search = querystring;
    } else {
      search = window.location.search; // eslint-disable-line
    }

    return qs.parse(search);
  };

  render() {
    const { component, render, children } = this.props;
    const { processing, state, error } = this.state;

    if (component != null)
      return React.createElement(component, { processing, state, error });
    if (render != null) return render({ processing, state, error });
    if (children != null) {
      React.Children.only(children);
      return children({ processing, state, error });
    }

    return null;
  }
}