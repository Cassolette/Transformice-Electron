var ipc = window.ipcRenderer;

/* GAPI */
var gapiInitialise = false;

function gapiEstInitialise() {
    return gapiInitialise;
}

function initialiserGAPI() {
    var idClient = "815332750938-gb9naef3nm2oe7g9k4idr68gc0jbm3gl.apps.googleusercontent.com";

    gapi.load('auth2', function() {
        gapi.auth2.init({
            client_id: idClient,
        }).then(function() {
            gapiInitialise = true;
            var onInitialisationGAPITerminee = document.getElementById('swf2')['onInitialisationGAPITerminee'];
            if (onInitialisationGAPITerminee) {
                onInitialisationGAPITerminee();
            }
        }, function() {
            var onErreurInitialisationGAPI = document.getElementById('swf2')['onErreurInitialisationGAPI'];
            if (onErreurInitialisationGAPI) {
                onErreurInitialisationGAPI();
            }
        });
    });
}

function estAuthentifieSurGoogle() {
    return gapi.auth2.getAuthInstance().isSignedIn.get();
}

function recupTokenConnexionGoogle() {
    return gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
}

function authentifierSurGoogle() {
    gapi.auth2.getAuthInstance().signIn({
        prompt: 'select_account'
    }).then(function() {
        var token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
        document.getElementById('swf2')['onAuthGoogle'](token);
    }, function() {
        document.getElementById('swf2')['onErreurAuthGoogle']();
    });
}


/* Facebook Auth */
var authFBInitialisee = false;

window.fbAsyncInit = function() {
    FB.init({
        appId: '1814909921903510',
        version: 'v2.12',
        status: true
    });
    authFBInitialisee = true;
};

function authFBEstInitialisee() {
    return authFBInitialisee;
}

function authentifierSurFB() {
    FB.login(function(reponse) {
        if (reponse.authResponse) {
            document.getElementById('swf2')['onAuthFB'](reponse.authResponse.userID, reponse.authResponse.accessToken);
        }
    }, {
        scope: 'email'
    });
}

function determinerLocaleFB() {
    var langueNav = navigator.languages ? navigator.languages.find(function(l) {return l.indexOf("_") >= 1 || l.indexOf("-") >= 1}) || navigator.languages[0] : navigator.language || navigator.userLanguage || "en_US";
    return langueNav.replace(/^[a-zA-Z0-9]+/, function(langue) {return langue.toLowerCase();}).replace(/[_\-]([a-zA-Z0-9]+)/, function(s, pays) {return "_" + pays.toUpperCase();});
}

(function chargerScriptFB() {
    var scriptFacebook = document.createElement('script');
    scriptFacebook.src = "https://connect.facebook.net/" + determinerLocaleFB() + "/sdk.js";
    document.getElementById("tfm-ext").parentNode.appendChild(scriptFacebook);
})();

/* TFM callback */
var langue = navigator.language;
if (!langue) {
    langue = navigator.browserLanguage;
}
langue = langue.substr(0, 2);

function positionMolette(X, Y) {
}
function activerMolette(OUI, HAUT) {
}
function recupLangue() {
    return langue;
}
function navigateur() {
    return "chargeur-electron";
}
function pleinEcran(OUI) {
    ipc.send("tfm-full-screen", OUI);
}
