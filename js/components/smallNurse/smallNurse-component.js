/**
 * Afficher une infirmière sous un plus petit format
 *
 * @type 
 */

// récuperer le template et le css
var template = require('./smallNurse-template.html');
require('./smallNurse-component.css');

// utilitaires et constantes
var constants = require('../../utils/constants.js');

var SmallNurseController = function ($http, datah, $scope) {

    // conserver les références des services
    this.$http = $http;
    this.datah = datah;
    this.$scope = $scope;

};
// injection de dépendance sous forme d'un tableau de chaine de caractères
SmallNurseController.$inject = ["$http", constants.serviceDataHandler, "$scope"];

module.exports = function (angularMod) {

    angularMod.component("smallNurse", {
        template: template,
        controller: SmallNurseController,
        bindings: {
            data: "<"
        }
    });
};