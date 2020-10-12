var Youtube = (function Youtube() {
    
    var nomJeuId = "transformice";

    var conteneurYoutube;
    var lecteurYoutube;

    var infoEcranJeu = null;
    var positionNormaleLecteurYoutube = null;
    var infoLecteurYoutube = null;
    var infoPositionLecteurYoutube = null;
    var positionChangee = false;


    function initialiserAPIYoutube() {
        if (document.getElementById("ytb")) {
            return;
        }

        var divJeu = document.getElementById(nomJeuId);
        
        conteneurYoutube = document.createElement("div");
        conteneurYoutube.setAttribute("id", "ytb-conteneur");
        
        var ytb = document.createElement("div");
        ytb.setAttribute("id", "ytb");
        
        var overlayYtb = document.createElement("div");
        overlayYtb.setAttribute("style", "top: 0; left: 0; width: 100%; height: 100%; position: absolute;");
        
        divJeu.appendChild(conteneurYoutube);
        conteneurYoutube.appendChild(ytb);
        conteneurYoutube.appendChild(overlayYtb);
        rendreDeplacable(conteneurYoutube);
        
        window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

        var scriptAPIYoutube = document.createElement('script');
        scriptAPIYoutube.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(scriptAPIYoutube);
    }

    function onYouTubeIframeAPIReady() {
        lecteurYoutube = new YT.Player('ytb', {
            height: '1',
            width: '1',
            playerVars: { 'controls': 0, 'disablekb': 1, 'iv_load_policy': 3, 'rel': 0, 'showinfo': 0 },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
                'onError': onPlayerError
            }
        });

        window.onYouTubeIframeAPIReady = null;
    }

    function onPlayerReady(event) {
        document.getElementById("swf2")["finChargementLecteur"]();
    }

    function onPlayerStateChange(event) {
    }

    function onPlayerError(event) {
    }

    
    function jouerVideo() {
        lecteurYoutube.playVideo();
    }
    
    function mettreEnPauseVideo() {
        lecteurYoutube.pauseVideo();
    }
    
    function arreterVideo() {
        lecteurYoutube.stopVideo();
    }
    
    function chargerVideoParId(idVideo, position, qualite) {
        lecteurYoutube.loadVideoById(idVideo, position, qualite);
    }
    
    function recupPosition() {
        return lecteurYoutube.getCurrentTime();
    }
    
    function defPosition(position, faireRequete) {
        lecteurYoutube.seekTo(position, faireRequete);
    }
    
    function changerVolume(volume) {
        lecteurYoutube.setVolume(volume);
    }
    
    function recupEtatLecteur() {
        return lecteurYoutube.getPlayerState();
    }

    function cacher() {
        conteneurYoutube.style.display = "none";
    }
    
    function changerTaille(posX, posY, largeur, hauteur, decalage_largeur, decalage_hauteur) {
        infoEcranJeu = { "x": posX, "y": posY, "largeur": largeur, "hauteur": hauteur };

        var swfJeu = document.getElementById("swf2");
        if (swfJeu) {
            var positionSwfJeu = calculerPosition(swfJeu);
            positionNormaleLecteurYoutube = {
                "x" : posX + positionSwfJeu.left + decalage_largeur,
                "y" : posY + positionSwfJeu.top + decalage_hauteur
            };
        }

        infoLecteurYoutube = {
            "x": (positionChangee && infoLecteurYoutube) ? infoLecteurYoutube.x + (infoLecteurYoutube.largeur - largeur) / 2 : positionNormaleLecteurYoutube.x ,
            "y": (positionChangee && infoLecteurYoutube) ? infoLecteurYoutube.y + (infoLecteurYoutube.hauteur - hauteur) / 2 : positionNormaleLecteurYoutube.y,
            "largeur": largeur,
            "hauteur": hauteur
        };

        lecteurYoutube.setSize(largeur, hauteur);
        conteneurYoutube.setAttribute("style", "position: absolute; left: " + infoLecteurYoutube.x + "px; top: " + infoLecteurYoutube.y + "px;");
    }


    function rendreDeplacable(element) {
        var dragging = null;

        addListener(element, "mousedown", function(e) {
            var e = window.event || e;

            dragging = {
                mouseX: e.clientX,
                mouseY: e.clientY,
                startX: parseInt(element.style.left),
                startY: parseInt(element.style.top)
            };
            if (element.setCapture) element.setCapture();
        });

        addListener(element, "losecapture", function() {
            dragging = null;
        });

        addListener(document, "keydown", function(e) {
            var e = window.event || e;

            var toucheEchap = false;
            if ("key" in e) {
                toucheEchap = (e.key == "Escape" || e.key == "Esc");
            } else {
                toucheEchap = (e.keyCode == 27);
            }

            if (dragging && toucheEchap && positionChangee && positionNormaleLecteurYoutube) {
                infoLecteurYoutube.x = positionNormaleLecteurYoutube.x;
                infoLecteurYoutube.y = positionNormaleLecteurYoutube.y;
                element.style.top = infoLecteurYoutube.y + "px";
                element.style.left = infoLecteurYoutube.x + "px";
                positionChangee = false;
                dispatchEvent(document, "mouseup");
            }
        });

        addListener(document, "mouseup", function () {
            dragging = null;
            if (document.releaseCapture) document.releaseCapture();
        }, true);

        var dragTarget = element.setCapture ? element : document;

        addListener(dragTarget, "mousemove", function(e) {
            if (!dragging) return;

            var e = window.event || e;
            var top = dragging.startY + (e.clientY - dragging.mouseY);
            var left = dragging.startX + (e.clientX - dragging.mouseX);
          
            if (infoLecteurYoutube) {
                infoLecteurYoutube.x = Math.max(0, left);
                infoLecteurYoutube.y = Math.max(0, top);
                element.style.top = infoLecteurYoutube.y + "px";
                element.style.left = infoLecteurYoutube.x + "px";
                positionChangee = true;
            }
        }, true);
    }
    
    
    function addListener(element, type, callback, capture) {
        if (element.addEventListener) {
            element.addEventListener(type, callback, capture);
        } else {
            element.attachEvent("on" + type, callback);
        }
    }
    
    function dispatchEvent(element, type) {
        if (document.createEvent) {
            var event = document.createEvent('HTMLEvents');
            event.initEvent(type, true, true);
            element.dispatchEvent(event);
        } else {
            element.fireEvent("on" + type, document.createEventObject());
        }
    }

    function calculerPosition(obj) {
        var curleft = curtop = 0;
        if (obj.offsetParent) {
            do {
                curleft += obj.offsetLeft;
                curtop += obj.offsetTop;
            } while (obj = obj.offsetParent);
        }
        return { "left": curleft, "top": curtop};
    }

    return {
        "init": initialiserAPIYoutube,
        "API": {
            "jouerVideo": jouerVideo,
            "mettreEnPauseVideo": mettreEnPauseVideo,
            "arreterVideo": arreterVideo,
            "chargerVideoParId": chargerVideoParId,
            "recupPosition": recupPosition,
            "defPosition": defPosition,
            "changerTaille": changerTaille,
            "cacher": cacher,
            "changerVolume": changerVolume,
            "recupEtatLecteur": recupEtatLecteur
        }
    }
})();
