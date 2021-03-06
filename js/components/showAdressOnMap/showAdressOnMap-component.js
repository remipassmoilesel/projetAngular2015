/**
 * Afficher une adresse dans une carte interactive.
 *
 * L'adresse doit de préférence etre formattée comme suit:
 * numéro_rue type_voie nom_rue, code_postal, ville, pays
 *
 * @type Module formNewPatient-template|Module formNewPatient-template
 */

// récuperer le template et le css
var template = require('./showAdressOnMap-template.html');
require('./showAdressOnMap-component.css');

var constants = require('../../utils/constants.js');

// outils cartographiques
var L = require("leaflet");
require('leaflet/dist/leaflet.css');

var ShowAdressOnMapController = function ($http, datah, $scope, $timeout) {

    // conserver les références des services
    this.$http = $http;
    this.datah = datah;
    this.$scope = $scope;

    // identifiant dynamique
    this.mapid = "showAdressOnMap" + new Date().getTime();

    // taille de la carte
    this.mapHeight = this.mapHeight || "300px";

    // affichage de messages d'erreur
    this.errorMessage = "";

    // stockage de la position géographique en latitude longitude
    this.adressPosition = undefined;

    // initialisation tardive de la carte, pour laisser le temps
    // a angular de traiter l'id du div
    this.mapInitialized = false;
    $timeout(function () {
        vm.initializeMap.call(vm);
    }, 0);

    // mettre à jour la carte si l'adresse change
    var vm = this;
    this.$scope.$watch(function () {
        return vm.adress;
    }, function () {
        vm.resolveAdress();
    });

};

// injection de dépendance sous forme d'un tableau de chaine de caractères
ShowAdressOnMapController.$inject = ["$http", constants.serviceDataHandler, "$scope", "$timeout"];

ShowAdressOnMapController.prototype.initializeMap = function () {

    // creation de la carte
    this.map = L.map(this.mapid);

    // creation et ajot de la couche osm
    var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    var osmAttrib = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
    var osm = new L.TileLayer(osmUrl, {attribution: osmAttrib});

    this.map.addLayer(osm);

    // creation d'un marqueur pour positionner l'adresse
    this.geoMarkIcon = L.icon({
        iconUrl: '/images/geo-mark.png',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [20, 0]
    });

    // ajouter la marque à la carte, position arbitraire
    this.geoMark = L.marker([0, 0], {icon: this.geoMarkIcon}).addTo(this.map);

    // marquer comme initialisée
    this.mapInitialized = true;

    // première resolution d'adresse
    this.resolveAdress();

};

/**
 * Résout l'adresse et l'affiche sur la carte.
 * @returns {undefined}
 */
ShowAdressOnMapController.prototype.resolveAdress = function () {

    var vm = this;

    // pas d'execution avant que la carte ne soit initialisée
    if (this.mapInitialized === false) {
        return;
    }

    var empty = /^\s*$/i;
    if (this.adress.match(empty)){
        vm.showGeocodingErrorMessage("invalidAddress");
        return;
    }

    // résoudre la position géographique de l'adresse
    this.$http({
            url: 'http://nominatim.openstreetmap.org/search',
            mehtod: "GET",
            params: {
                q: this.adress,
                format: "json"
            }
        })

        // résolue avec succès, peut être....
        .then(function (response) {

            if (response.data.length < 1) {
                console.log("Erreur lors du géocodage", response);
                vm.showGeocodingErrorMessage("notFound");
                return;
            }

            vm.showGeocodingErrorMessage("reset");

            // stocker l'adresse
            vm.adressPosition = [
                response.data[0].lat,
                response.data[0].lon];

            // modifier la carte
            vm.setMapView(
                vm.adressPosition[0],
                vm.adressPosition[1]
            );

        })

        // erreur lors de la résolution
        .catch(function (response) {
            console.log("Erreur lors du géocodage");
            console.log(response);
            vm.showGeocodingErrorMessage("serverError");
        });

};

/**
 * Afficher un message d'erreur en cas de probleme de geocodage ou le reinitialiser
 * @param {type} message
 * @returns {undefined}
 */
ShowAdressOnMapController.prototype.showGeocodingErrorMessage = function (messageType) {

    if (messageType === "serverError") {
        this.errorMessage = "Erreur lors de l'affichage de la carte. Veuillez réessayer.";
        this.buttonText = "Rafraichir";
        this.adressPosition = undefined;
    }

    else if (messageType === "notFound") {
        this.errorMessage = "Adresse non trouvée. Tentez votre " +
            "chance <a href='https://www.google.fr/maps/place/" + this.adress + "'" +
            " target='_blank'>ailleurs</a>.";
        this.buttonText = "Rafraichir";
        this.adressPosition = undefined;
    }

    else if (messageType === "invalidAddress") {
        this.errorMessage = "Adresse non valide.";
        this.buttonText = "Rafraichir";
        this.adressPosition = undefined;
    }

    else {
        this.errorMessage = "";
        this.buttonText = "Recentrer la carte";
    }
};

/**
 * Modifie l'affichage de la carte pour afficher une position et une marque aux coordonnées
 * passée en parametre
 * @returns {undefined}
 */
ShowAdressOnMapController.prototype.setMapView = function (lat, lng, zoom, messageHtml) {

    // zoom par défaut
    zoom = zoom || 15;

    // coordonnées
    var latLon = new L.LatLng(lat, lng);

    // modifier l'affichage de la carte
    this.map.setView(latLon, zoom);

    // placer la marque
    this.geoMark.setLatLng(latLon);

    // afficher eventuellement un message
    if (typeof messageHtml !== "undefined") {
        marker.bindPopup(messageHtml).openPopup();
    }
};

module.exports = function (angularMod) {

    //Syntaxe composant
    angularMod.component("showAdressOnMap", {
        template: template,
        controller: ShowAdressOnMapController,
        bindings: {
            adress: "@",
            mapHeight: "@"
        }
    });

};
