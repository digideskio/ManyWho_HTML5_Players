﻿/*!

Copyright 2013 Manywho, Inc.

Licensed under the Manywho License, Version 1.0 (the "License"); you may not use this
file except in compliance with the License.

You may obtain a copy of the License at: http://manywho.com/sharedsource

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied. See the License for the specific language governing
permissions and limitations under the License.

*/

var ManyWhoSharedServices = {
    // This method is called when the application starts - to initialize all of the shared services components.
    //
    initialize: function (reference) {
        // Check to make sure we haven't already initialized the shared services - we don't want to do it twice - but this method can be called multiple times when
        // running the designer and engine together
        if ($('#manywho-shared-services-data').get(0) == null) {
            // The values store
            var valuesData = '';
            var dialogHtml = '';

            valuesData = '<div id="manywho-shared-services-data"></div>';

            $('#' + reference).append(valuesData);

            dialogHtml += '<div id="manywho-dialog" class="modal container hide fade">';
            dialogHtml += '    <div class="modal-header">';
            dialogHtml += '        <button id="manywho-dialog-close-button" type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>';
            dialogHtml += '        <h3 id="manywho-dialog-title"></h3>';
            dialogHtml += '    </div>';
            dialogHtml += '    <div id="manywho-model-runtime" style="overflow: auto; height: 550px;" class="modal-body">';
            dialogHtml += '    </div>';
            dialogHtml += '    <div id="manywho-model-outcomes" class="modal-footer">';
            dialogHtml += '    </div>';
            dialogHtml += '</div>';

            $('#' + reference).append(dialogHtml);
            $('#manywho-dialog').modalmanager();

            // Create the variable element detail form
            $('#manywho-dialog').hide();
            $('#manywho-model-runtime').manywhoRuntimeEngine({ enableAuthentication: false, rewriteUrl: false, tenantId: ManyWhoConstants.MANYWHO_ADMIN_TENANT_ID });
        }
    },
    createInput: function (inputs, key, value, contentType, objectData) {
        var input = null;

        if (inputs == null) {
            inputs = new Array();
        }

        input = new Object();
        input.developerName = key;
        input.contentValue = value;
        input.contentType = contentType;
        input.objectData = objectData;

        inputs[inputs.length] = input;

        return inputs;
    },
    adjustDialog: function (height, width, enableClose) {
        if (enableClose == false) {
            $('#manywho-dialog-close-button').hide();
        } else {
            $('#manywho-dialog-close-button').show();
        }

        if (width == null) {
            // Remove the sizing attribute
            $('#manywho-dialog').removeAttr('data-width');

            // Make the width of the dialog the same size as the container
            if ($('#manywho-dialog').hasClass('container') == false) {
                $('#manywho-dialog').addClass('container');
            }
        } else {
            $('#manywho-dialog').removeClass('container');
            $('#manywho-dialog').attr('data-width', '760');
        }

        $('#manywho-model-runtime').attr('style', 'overflow: auto; height: ' + height + 'px;');
    },
    showAuthenticationDialog: function (okCallback, loginUrl, manywhoTenantId) {
        ManyWhoSharedServices.adjustDialog(175, 550, false);
        ManyWhoFlow.loadByName('ManyWhoSharedServices.ShowAuthenticationDialog',
                               ManyWhoConstants.MANYWHO_ADMIN_TENANT_ID,
                               'MANYWHO__AUTHENTICATION__DEFAULT__FLOW',
                               null,
                               function (data, status, xhr) {
                                   var inputs = null;

                                   inputs = ManyWhoSharedServices.createInput(inputs, 'LoginUrl', loginUrl, ManyWhoConstants.CONTENT_TYPE_STRING, null);
                                   inputs = ManyWhoSharedServices.createInput(inputs, 'ManyWhoTenantId', manywhoTenantId, ManyWhoConstants.CONTENT_TYPE_STRING, null);

                                   $('#manywho-model-runtime').manywhoRuntimeEngine('run',
                                                                                    null,
                                                                                    data.id.id,
                                                                                    data.id.versionId,
                                                                                    inputs,
                                                                                    function (outputValues) {
                                                                                        var authenticationToken = null;

                                                                                        // Hide the dialog
                                                                                        $('#manywho-dialog').modal('hide');

                                                                                        // Get the values out of the outputs
                                                                                        authenticationToken = ManyWhoUtils.getOutcomeValue(outputValues, 'AuthenticationToken', null);

                                                                                        // Call the OK callback
                                                                                        okCallback.call(this, authenticationToken);
                                                                                    },
                                                                                    'manywho-model-outcomes',
                                                                                    'manywho-dialog-title',
                                                                                    null,
                                                                                    null,
                                                                                    true);

                                   $('#manywho-dialog').modal({ backdrop: 'static', show: true });
                               },
                               null);
    },
    setDeveloperMode: function (mode) {
        $('#manywho-shared-services-data').data('developerMode', mode);
    },
    getDeveloperMode: function () {
        var storedMode = $('#manywho-shared-services-data').data('developerMode');
        var responseMode = false;

        if (storedMode == 'true' ||
            storedMode == true) {
            responseMode = true;
        }

        return responseMode;
    },
    setEditingToken: function (editingToken) {
        $('#manywho-shared-services-data').data('editingtoken', editingToken);
    },
    getEditingToken: function () {
        return $('#manywho-shared-services-data').data('editingtoken');
    },
    setTenantId: function (tenantId) {
        $('#manywho-shared-services-data').data('tenantid', tenantId);
    },
    getTenantId: function () {
        return $('#manywho-shared-services-data').data('tenantid');
    },
    setFlowId: function (flowId) {
        $('#manywho-shared-services-data').data('flowid', flowId);
    },
    getFlowId: function () {
        return $('#manywho-shared-services-data').data('flowid');
    },
    setAuthenticationToken: function (authenticationToken) {
        // Put the token in the cookie also
        ManyWhoUtils.setCookie('authenticationToken', authenticationToken);

        $('#manywho-shared-services-data').data('authenticationtoken', authenticationToken);
    },
    getAuthenticationToken: function () {
        var authenticationToken = $('#manywho-shared-services-data').data('authenticationtoken');

        //if (authenticationToken == null ||
        //    authenticationToken == 'null') {
        //    // Try to get the token from the cookie
        //    authenticationToken = ManyWhoUtils.getCookie('authenticationToken');
        //}

        if (authenticationToken == null ||
            authenticationToken == 'null') {
            authenticationToken = '';
        }

        return authenticationToken;
    },
    setNetworkId: function (networkId) {
        $('#manywho-shared-services-data').data('networkid', networkId);
    },
    getNetworkId: function () {
        var networkId = $('#manywho-shared-services-data').data('networkid');

        if (networkId == null ||
            networkId == 'null') {
            networkId = '';
        }

        return networkId;
    }
}