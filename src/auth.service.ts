import { Injectable } from '@angular/core';
import { AppGlobals } from './app-globals';

// get window
function getWindow (): any {
  return window;
}
declare const gapi: any;

@Injectable()
export class AuthService {
  private APIROOT = 'endpoint2-dot-efor-gae-temp-01.appspot.com';
  private APILOCAL = 'localhost:8080';
  private EXTAPI = false; // true force to load APIROOT from local
  private gapi:any = {};
  private apiName:string;
  private apiVersion:string;

  constructor() {
    this.gapi = getWindow().gapi;
  }

  /**
   * Calling Google login API and fetching account details.
   * @param callback Callback to function
   */
  public apiInit(apiName:string, apiVersion:string, callback) {
    let auth2: any;
    let result: any;
    let error: any;
    let _thisClass = this;

    gapi.load('auth2', function () {
      auth2 = gapi.auth2.init({
        client_id: AppGlobals.GOOGLE_CLIENT_ID,
        cookiepolicy: 'single_host_origin',
        scope: AppGlobals.SCOPES
      });

      //Login button reference
      let loginButton: any = document.getElementById('google-login-button');

      auth2.attachClickHandler( loginButton, {}, function success(userDetails) {
          //Getting profile object
          let profile = userDetails.getBasicProfile();

          result = _thisClass.saveLogin(userDetails.getAuthResponse().id_token, profile);

          callback(result);

        },
        function failed(error) {
          this.error = (JSON.stringify(error, undefined, 2));
        });

    });

    this.apiAutoInit(apiName, apiVersion, callback);
  }

  private saveLogin(token:string, profile:any):any {
    let result:any;

    if (profile.getName) {
      result = {
        token: token,
        name: profile.getName(),
        image: profile.getImageUrl(),
        email: profile.getEmail()
      };
    } else {
      result = {
        token: token,
        name: profile['name'],
        image: profile['picture'],
        email: profile['email']
      };
    }

    //Setting data to localstorage.
    localStorage.setItem('login', JSON.stringify(result));
    return result;
  }

  public apiAutoInit (apiName:string, apiVersion:string, callback) {
    this.apiName = apiName;
    this.apiVersion = apiVersion;
    let host = location.host.match(/localhost/) ? this.APILOCAL : this.APIROOT ;
    host = this.EXTAPI ? this.APIROOT : host;
    let apiRoot = '//' + host + '/_ah/api';
    var apisToLoad;

    var callbackInint = () => {
      // 2 calls helloworld and oauth2
      if (--apisToLoad == 0) {
        // enableButtons();
        console.log( 'autenticando...' );
        this.signin( true, this.userAuthed(callback) );
      }
    }

    apisToLoad = 2; // must match number of calls to gapi.client.load()

    // gapi was loaded
    if ( this.gapi.client && this.gapi.client.load ) {
      this.gapi.client.load(this.apiName, this.apiVersion, callbackInint, apiRoot); // load Api
      this.gapi.client.load('oauth2', 'v2', callbackInint);
    } else {
      setTimeout(() => { this.apiInit(apiName, apiVersion, callback) }, 250)
    }

  }

  public signin(mode, callbackUserAuthed) {
    let authObj = { 'client_id': AppGlobals.GOOGLE_CLIENT_ID,
      'scope':      AppGlobals.SCOPES,
      'immediate': mode };
    this.gapi.auth.authorize(authObj, callbackUserAuthed); //apiHello.userAuthed
  };

  private userAuthed(callback) { // is executed in another context
    return () => {
      let gapi =  getWindow().gapi;
      let request = gapi.client.oauth2.userinfo.get().execute( respiUserAuth => {
      let result;
        if (!respiUserAuth.code) {
          console.log('loging true', respiUserAuth);
          result = this.saveLogin('', respiUserAuth);
          callback(result);
        }
      });
    }
  };

  public userLogout(callback) {
    let homeUrl = location.origin; // "http://localhost:4200";
    let logoutUrl = "https://www.google.com/accounts/Logout?continue=https://appengine.google.com/_ah/logout?continue=" + homeUrl;
    document.location.href = logoutUrl;
    callback();
  }
}
