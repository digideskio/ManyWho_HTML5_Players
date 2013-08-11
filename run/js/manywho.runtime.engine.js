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

(function ($) {

    //var doneCallback = null;
    var jsonEditorPreCommit = null;
    var jsonEditorCommit = null;

    var getAddRealtime = function (domId) {
        // We only add realtime if we have a feed
        if ($('#' + domId + '-social-feed').html().length > 0) {
            addRealtime = true;
        } else {
            addRealtime = false;
        }

        return addRealtime;
    };

    var checkStateChanges = function (domId, check) {
        if (check == true) {
            $('#' + domId + '-join-thread-id').val(setInterval(function () {
                // Create a header for the tenant id
                var headers = ManyWhoAjax.createHeader(null, 'ManyWhoTenant', $('#' + domId + '-tenant-id').val());

                // Check to see if anything changed
                ManyWhoFlow.stateChangeHappened('ManyWhoRuntimeEngine.CheckStateChanges',
                                                $('#' + domId + '-state-id').val(),
                                                $('#' + domId + '-state-token').val(),
                                                null,
                                                function (data, status, xhr) {
                                                    if (data == true) {
                                                        // If something has changed, we want to call "join"
                                                        join(domId);
                                                    }
                                                },
                                                manageError(domId),
                                                headers);
            }, 10000));
        } else {
            clearInterval($('#' + domId + '-join-thread-id').val());
        }
    };

    var showWait = function (domId, message) {
        if (message != null) {
            $('#' + domId + '-wait-indicator-message').html(message);
        } else {
            $('#' + domId + '-wait-indicator-message').html('');
        }

        $('#' + domId + '-wait-indicator').show();
    };

    var showWaitContent = function (domId, message) {
        var html = '';

        html += '<p align="center"><img src="https://cdn.manywho.com/images/spinner.gif" height="180" width="180" alt="Please wait..." /></p>';
        html += '<p align="center" class="muted">' + message + '</p>';

        $('#' + domId + '-screen-content').html(html);
    }

    var hideWait = function (domId) {
        $('#' + domId + '-wait-indicator').hide();
    };

    var manageError = function (domId) {
        return function (xhr, status, errorMessage) {
            var message = '';

            if (xhr.status == 0) {
                message += '<strong>Yikes! We seem to have lost our backend.</strong> Make sure you\'re connected to the network and we\'ll try to connect again.';
            } else {
                message += '<strong>Status Code: ' + xhr.status + '</strong> ' + errorMessage;
                message += '<br/><br/>If you have any comments or concerns about this, please email us by clicking here:';
                message += '<a href="mailto:contact@manywho.com?subject=ManyWho Platform Error&body=' + errorMessage + '">contact@manywho.com</a>';
            }

            $('#' + domId + '-system-faults').html('');
            $('#' + domId + '-system-faults').show();
            $('#' + domId + '-system-faults').append('<div class="alert alert-error">' + message + '</div>');

            // Hide the wait as it's no longer applicable
            hideWait(domId);
        }
    };

    var initializeFlow = function (domId) {
        showWait(domId, 'Initializing Flow');
        checkStateChanges(domId, false);

        // Get the inputs in the page database
        var inputs = $('#' + domId + '-inputs-database').data('inputs');

        if (inputs == undefined) {
            inputs = null;
        }

        var annotations = $('#' + domId + '-inputs-database').data('annotations');

        if (annotations == undefined) {
            annotations = null;
        }

        if ($('#' + domId + '-flow-version-id').val() == null ||
            $('#' + domId + '-flow-version-id').val().trim().length == 0) {
            // We need to grab the fully versioned flow from the system before we can initialize
            ManyWhoFlow.load('ManyWhoRuntimeEngine.InitializeFlow',
                             $('#' + domId + '-tenant-id').val(),
                             $('#' + domId + '-flow-id').val(),
                             null,
                             function (data, status, xhr) {
                                 $('#' + domId + '-flow-id').val(data.id.id);
                                 $('#' + domId + '-flow-version-id').val(data.id.versionId);

                                 var requestUrl = $('#' + domId + '-engine-url').val();
                                 var requestType = 'POST';
                                 var requestData = '{' +
                                                       '"flowId":{' +
                                                           '"id":"' + $('#' + domId + '-flow-id').val() + '",' +
                                                           '"versionId":"' + $('#' + domId + '-flow-version-id').val() + '"' +
                                                       '},' +
                                                       '"initializationValues":null,' +
                                                       '"inputs":' + JSON.stringify(inputs) + ',' +
                                                       '"annotations":' + JSON.stringify(annotations) + ',' +
                                                       '"mode":"' + $('#' + domId + '-mode').val() + '"' +
                                               '}';

                                 // Create a header for the tenant id
                                 var headers = ManyWhoAjax.createHeader(null, 'ManyWhoTenant', $('#' + domId + '-tenant-id').val());

                                 ManyWhoAjax.callRestApi('ManyWhoRuntimeEngine.InitializeFlow', requestUrl, requestType, requestData, null, initializeSuccessCallback(domId), manageError(domId), headers);
                             },
                             manageError(domId));
        } else {
            // We have the fully versioned flow, we can initialize and start moving
            var requestUrl = $('#' + domId + '-engine-url').val();
            var requestType = 'POST';
            var requestData = '{' +
                                  '"flowId":{' +
                                      '"id":"' + $('#' + domId + '-flow-id').val() + '",' +
                                      '"versionId":"' + $('#' + domId + '-flow-version-id').val() + '"' +
                                  '},' +
                                  '"initializationValues":null,' +
                                  '"inputs":' + JSON.stringify(inputs) + ',' +
                                  '"annotations":' + JSON.stringify(annotations) + ',' +
                                  '"mode":"' + $('#' + domId + '-mode').val() + '"' +
                          '}';

            // Create a header for the tenant id
            var headers = ManyWhoAjax.createHeader(null, 'ManyWhoTenant', $('#' + domId + '-tenant-id').val());

            ManyWhoAjax.callRestApi('ManyWhoRuntimeEngine.InitializeFlow', requestUrl, requestType, requestData, null, initializeSuccessCallback(domId), manageError(domId), headers);
        }
    };

    var setEngineUrl = function (domId, url) {
        $('#' + domId + '-engine-url').val(url);
    };

    // This method is used to initialize the engine with a new state - ready for each engine execution
    // request/response cycle.
    //
    var initializeSuccessCallback = function (domId) {
        return function (data, status, xhr) {
            // The system is telling us we can't login
            if (data.statusCode == '401') {
                var loginUrl = null;

                if (data.authorizationContext != null) {
                    loginUrl = data.authorizationContext.loginUrl;
                }

                requestAuthentication(domId, loginUrl);
                return;
            }

            // Store the state id so we're referencing the correct instance data
            $('#' + domId + '-state-id').val(data.stateId);

            // Store the current element information
            $('#' + domId + '-element-id').val(data.currentMapElementId);

            // Store the token from this response so we can check for any changes
            $('#' + domId + '-state-token').val(data.stateToken);

            // Start the stream
            startStream(domId, data.currentStreamId);

            // Execute the first request on the engine
            execute(domId, null, null, null);
        };
    };

    var startStream = function (domId, currentStreamId) {
        // Only start the stream if we actually have a stream id to use and we've not already started it!
        if (currentStreamId != null &&
            currentStreamId.trim().length > 0 &&
            $('#' + domId + '-social-feed').html().length == 0) {
            var options = {
                domId: domId,
                stateId: $('#' + domId + '-state-id').val(),
                networkName: 'Chatter',
                streamId: currentStreamId
            };

            // Show the feed controls
            $('#' + domId + '-social-feed-buttons').show();
            $('#' + domId + '-social-feed-followers').show();

            // Initialize the feed
            $('#' + domId + '-social-feed').manywhoSocialNetwork(options);
        }
    };

    // This method is used to make a call to the engine to execute.
    //
    var execute = function (domId, invokeType, selectedOutcomeId, formRequest) {
        // Stop automatic synchronization
        checkStateChanges(domId, false);

        // Clear any system faults
        $('#' + domId + '-system-faults').html('');
        $('#' + domId + '-system-faults').hide();

        showWait(domId, 'Executing Flow');

        if (invokeType == null) {
            invokeType = 'FORWARD';
        }

        var requestUrl = $('#' + domId + '-engine-url').val() + '/state/' + $('#' + domId + '-state-id').val();
        var requestType = 'POST';
        var requestData = createRequestData(domId, invokeType, selectedOutcomeId, formRequest);

        // Create a header for the tenant id
        var headers = ManyWhoAjax.createHeader(null, 'ManyWhoTenant', $('#' + domId + '-tenant-id').val());

        // Send the request to the engine to start the flow
        ManyWhoAjax.callRestApi('Execute', requestUrl, requestType, requestData, null, executeSuccessCallback(domId), manageError(domId), headers);
    };

    // This method is used to generate the screen data after each engine execution request/response cycle.
    //
    var executeSuccessCallback = function (domId) {
        return function (data, status, xhr) {
            // The system is telling us we can't login
            if (data.statusCode == '401') {
                var loginUrl = null;

                if (data.authorizationContext != null) {
                    loginUrl = data.authorizationContext.loginUrl;
                }

                requestAuthentication(domId, loginUrl);
                return;
            }

            // Update the runtime with the join url in case the user refreshes - this value comes from the service
            updateUrl(domId, data, data.joinFlowUri);

            // We'll use this in the logic to help us debug flows
            var debugging = false;

            // Store the current element information
            $('#' + domId + '-element-id').val(data.currentMapElementId);

            // Store the state token for this response so we can check for any changes
            $('#' + domId + '-state-token').val(data.stateToken);

            // Write the debug information if we're in the mode
            if ($('#' + domId + '-mode').val() == ManyWhoConstants.MODE_DEBUG ||
                $('#' + domId + '-mode').val() == ManyWhoConstants.MODE_DEBUG_STEPTHROUGH) {
                debugging = true;

                if ($('#' + domId + '-debug-alert').length == 0) {
                    // Create the alert html
                    $('#' + domId + '-debug').html(createAlert(domId));

                    // Put an event on the debug info so if the user closes it, we stop sending the debug mode through
                    $('#' + domId + '-debug-alert').bind('close', function () {
                        // Blank out the mode so we're no longer doing the step-through
                        $('#' + domId + '-mode').val('');
                    });

                    // Null out the editors as we need to recreate them
                    jsonEditorPreCommit = null;
                    jsonEditorCommit = null;
                }

                if (data.preCommitStateValues != null &&
                    data.preCommitStateValues.length > 0) {
                    if (jsonEditorPreCommit == null) {
                        jsonEditorPreCommit = new jsoneditor.JSONEditor(document.getElementById(domId + '-debug-precommit-state-values'), { mode: 'view' }, data.preCommitStateValues);
                    } else {
                        jsonEditorPreCommit.set(data.preCommitStateValues);
                    }
                }

                if (data.stateValues != null &&
                    data.stateValues.length > 0) {
                    if (jsonEditorCommit == null) {
                        jsonEditorCommit = new jsoneditor.JSONEditor(document.getElementById(domId + '-debug-state-values'), { mode: 'view' }, data.stateValues);
                    } else {
                        jsonEditorCommit.set(data.stateValues);
                    }
                }

                // Check to see if we have any map element invoke responses
                if (data.mapElementInvokeResponses != null &&
                    data.mapElementInvokeResponses.length > 0) {
                    var mapElementInvokeResponse = data.mapElementInvokeResponses[0];

                    // Check to see if we have any outcomes - if we do, we don't allow the done event to fire just yet!
                    if (mapElementInvokeResponse.outcomeResponses != null &&
                        mapElementInvokeResponse.outcomeResponses.length > 0 &&
                        data.invokeType == 'DONE') {
                        // Overwrite the invoke type so the event will not be called until this 'continue' call is completed
                        data.invokeType = 'FORWARD';
                    }
                }
            }

            // We don't want to clear the form for synchronization stuff
            if (data.invokeType != 'SYNC') {
                // Destroy any previous form stuff
                $('#' + domId + '-screen-content').manywhoFormBootStrap('destroy');
            }

            if (data.invokeType != 'STATUS' &&
                data.invokeType != 'SYNC') {
                // Clear the toolbar buttons for navigation
                // Blank out the outcome buttons
                $('#' + $('#' + domId + '-outcome-panel').val()).html('');
                $('#' + domId + '-toolbar-outcome-buttons').html('');
            }

            // Make sure we show the user any faults
            if (data.mapElementInvokeResponses != null &&
                data.mapElementInvokeResponses.length > 0) {
                var mapElementInvokeResponse = data.mapElementInvokeResponses[0];

                if (mapElementInvokeResponse.rootFaults != null) {
                    $('#' + domId + '-root-faults').html('');
                    $('#' + domId + '-root-faults').show();

                    for (var rootFault in mapElementInvokeResponse.rootFaults) {
                        $('#' + domId + '-root-faults').append('<div class="alert alert-error"><strong>' + rootFault + '</strong> ' + mapElementInvokeResponse.rootFaults[rootFault] + '</div>');
                    }
                } else {
                    $('#' + domId + '-root-faults').html('');
                    $('#' + domId + '-root-faults').hide();
                }
            }

            if (data.invokeType != 'WAIT' &&
                data.invokeType != 'STATUS' &&
                data.invokeType != 'SAVE' &&
                data.invokeType != 'DONE' &&
                data.mapElementInvokeResponses != null &&
                data.mapElementInvokeResponses.length > 0) {
                // Get the first map element invoke response out of the list - we only support 1
                var mapElementInvokeResponse = data.mapElementInvokeResponses[0];

                // We don't want to clear the form if we're simply doing a status update
                if (data.invokeType != 'STATUS' &&
                    data.invokeType != 'SYNC') {
                    // Generate a new form
                    // TODO: need to change the register to this isn't being used for all apps
                    $('#' + domId + '-screen-content').manywhoFormBootStrap({ id: 'form', label: null, addRealtime: getAddRealtime(domId), stateId: $('#' + domId + '-state-id').val(), tenantId: $('#' + domId + '-tenant-id').val(), sectionFormat: 'tabs', columnFormat: 'none', register: [{ tag: 'Form Editor', component: ManyWhoTagFormEditor }] });
                }

                if (data.invokeType == 'SYNC') {
                    $('#' + domId + '-screen-content').manywhoFormBootStrap('update', mapElementInvokeResponse.pageResponse);
                } else {
                    $('#' + domId + '-screen-content').manywhoFormBootStrap('assemble',
                                                                            mapElementInvokeResponse.pageResponse,
                                                                            function (fieldId) {
                                                                                // Get the outcome identifier from the clicked button
                                                                                sync(domId);
                                                                            },
                                                                            mapElementInvokeResponse.outcomeResponses,
                                                                            function (outcomeId) {
                                                                                // Tell the engine to go forward based on the outcome being clicked
                                                                                execute(domId, 'FORWARD', outcomeId, createFormRequest(domId));
                                                                            },
                                                                            $('#' + domId + '-outcome-panel').val(),
                                                                            $('#' + domId + '-form-label-panel').val(),
                                                                            domId + '-viewstate-database',
                                                                            mapElementInvokeResponse.mapElementId.id);
                }

                // We don't want to finish if we've already painted the form
                // We also don't want to recreate the outcome responses
                if (data.invokeType != 'STATUS' &&
                    data.invokeType != 'SYNC') {
                    $('#' + domId + '-screen-content').manywhoFormBootStrap('finish');
                }
            }

            if (data.invokeType == 'WAIT' ||
                data.invokeType == 'STATUS') {
                if (data.invokeType == 'WAIT') {
                    showWaitContent(domId, data.waitMessage);
                } else {
                    showWaitContent(domId, 'Waiting For Authorized Users');
                }
            } else if ($('#' + domId + '-join-thread-id').val() != null &&
                       $('#' + domId + '-join-thread-id').val().trim().length > 0) {
                clearInterval($('#' + domId + '-join-thread-id').val());
            }

            if (data.invokeType == 'SAVE') {
                // Blank out the social feed identifier
                //$('#' + domId + '-social-feed').manywhoSocial('setStreamId', null);

                // Destroy any previous form stuff
                $('#' + domId + '-screen-content').manywhoFormBootStrap('destroy');
            } else {
                // Update the stream information
                //$('#' + domId + '-social-feed').manywhoSocial('setStreamId', data.currentStreamId);
            }

            // Finally, hide the wait
            hideWait(domId);

            var doneCallback = $('#' + domId + '-inputs-database').data('doneCallback');

            // We're done - tell the user!
            if (data.invokeType == 'DONE') {
                if (doneCallback != null) {
                    doneCallback.call(this, data.outputs);
                } else {
                    alert('Done!');

                    // Destroy any previous form stuff
                    $('#' + domId + '-screen-content').manywhoFormBootStrap('destroy');
                }
            } else {
                // If we're done, we shouldn't check state any more, so only do this if we're not DONE
                checkStateChanges(domId, true);
            }
        };
    };

    var sync = function (domId) {
        // Execute based on a sync invoke type
        execute(domId, 'SYNC', null, createFormRequest(domId));
    };

    var updateUrl = function (domId, data, joinFlowUrl) {
        var rewriteUrl = null;
        var mode = null;

        rewriteUrl = $('#' + domId + '-rewrite-url').val();
        mode = $('#' + domId + '-mode').val();

        if (rewriteUrl != null &&
            (rewriteUrl == true ||
             rewriteUrl.toLowerCase() == 'true')) {

            // If the user has specified a mode of execution, we append that to the url also
            if (mode != null &&
                mode.trim().length > 0) {
                joinFlowUrl += '&mode=' + mode;
            }

            // rewrite the url as specified
            ManyWhoUtils.updateUrl(data, joinFlowUrl);
        }
    };

    var join = function (domId) {
        // We don't show a wait as the user will already be looking at a wait spinner
        var requestUrl = $('#' + domId + '-engine-url').val() + '/state/' + $('#' + domId + '-state-id').val();
        var requestType = 'GET';
        var requestData = '';

        // Create a header for the tenant id
        var headers = ManyWhoAjax.createHeader(null, 'ManyWhoTenant', $('#' + domId + '-tenant-id').val());

        // Send the request to the engine to start the flow
        ManyWhoAjax.callRestApi('Join', requestUrl, requestType, requestData, null, joinSuccessCallback(domId), manageError(domId), headers);
    };

    var joinSuccessCallback = function (domId) {
        return function (data, status, xhr) {
            // The system is telling us we can't login
            if (data.statusCode == '401') {
                var loginUrl = null;

                if (data.authorizationContext != null) {
                    loginUrl = data.authorizationContext.loginUrl;
                }

                requestAuthentication(domId, loginUrl);
                return;
            }

            // Update the runtime with the join url in case the user refreshes - this value comes from the service
            updateUrl(domId, data, data.joinFlowUri);

            if (data.invokeType == 'FORWARD') {
                // We need to assign this as it may be different from what we thought
                $('#' + domId + '-element-id').val(data.currentMapElementId);

                // Store the state token also so we have it to check for changes
                $('#' + domId + '-state-token').val(data.stateToken);

                // Start the stream
                startStream(domId, data.currentStreamId);

                // Now execute the success callback
                executeSuccessCallback(domId).call(this, data, status, xhr);
            } else if (data.invokeType == 'DONE') {
                // We're done - tell the user!
                if ($('#' + domId + '-join-thread-id').val() != null &&
                    $('#' + domId + '-join-thread-id').val().trim().length > 0) {
                    clearInterval($('#' + domId + '-join-thread-id').val());
                }

                var doneCallback = $('#' + domId + '-inputs-database').data('doneCallback');

                if (doneCallback != null) {
                    doneCallback.call(this, data.outputs);
                } else {
                    alert('Done!');

                    // Destroy any previous form stuff
                    $('#' + domId + '-screen-content').manywhoFormBootStrap('destroy');
                }
            } else if (data.invokeType == 'WAIT' ||
                       data.invokeType == 'STATUS') {
                if (data.invokeType == 'WAIT') {
                    showWaitContent(domId, data.waitMessage);
                } else {
                    showWaitContent(domId, 'Waiting For Authorized Users');
                }
            }
        };
    };

    // This is a utility method for generating the request data for the engine execution.  This method
    // is sort of recursive as we need to call it every time the engine returns a response and we want
    // to make another request.
    //
    var createRequestData = function (domId, invokeType, selectedOutcomeId, formRequest) {
        var executeRequestData = '';

        executeRequestData += '{';
        executeRequestData += '"stateId":"' + $('#' + domId + '-state-id').val() + '",';
        executeRequestData += '"stateToken":"' + $('#' + domId + '-state-token').val() + '",';
        executeRequestData += '"currentMapElementId":"' + $('#' + domId + '-element-id').val() + '",';
        executeRequestData += '"geoLocation":{';
        executeRequestData += '"latitude":' + $('#' + domId + '-position-latitude').val() + ',';
        executeRequestData += '"longitude":' + $('#' + domId + '-position-longitude').val() + ',';
        executeRequestData += '"accuracy":' + $('#' + domId + '-position-accuracy').val() + ',';
        executeRequestData += '"altitude":' + $('#' + domId + '-position-altitude').val() + ',';
        executeRequestData += '"altitudeAccuracy":' + $('#' + domId + '-position-altitudeAccuracy').val() + ',';
        executeRequestData += '"heading":' + $('#' + domId + '-position-heading').val() + ',';
        executeRequestData += '"speed":' + $('#' + domId + '-position-speed').val() + '';
        executeRequestData += '},';
        executeRequestData += '"invokeType":"' + invokeType + '",';
        executeRequestData += '"mapElementInvokeRequest":{';
        executeRequestData += '"pageRequest":' + JSON.stringify(formRequest) + ',';

        if (selectedOutcomeId != null &&
            selectedOutcomeId.trim().length > 0) {
            executeRequestData += '"selectedOutcomeId":"' + selectedOutcomeId + '"';
        } else {
            executeRequestData += '"selectedOutcomeId":null';
        }

        executeRequestData += '},';
        executeRequestData += '"annotations":null,';
        executeRequestData += '"mode":"' + $('#' + domId + '-mode').val() + '"';
        executeRequestData += '}';

        return executeRequestData;
    };

    var createFormRequest = function (domId) {
        var formRequest = null;
        var fields = null;

        fields = $('#' + domId + '-screen-content').manywhoFormBootStrap('getFields');

        if (fields != null &&
            fields.length > 0) {
            formRequest = new Object();
            formRequest.pageComponentInputResponses = new Array();

            for (var i = 0; i < fields.length; i++) {
                var field = fields[i];
                var formFieldInputResponse = new Object();

                formFieldInputResponse.pageComponentId = field.pageComponentId;

                if (Object.prototype.toString.call(field.contentValue) == '[object Array]') {
                    formFieldInputResponse.objectData = field.contentValue;
                } else {
                    formFieldInputResponse.contentValue = field.contentValue;
                }

                formRequest.pageComponentInputResponses[formRequest.pageComponentInputResponses.length] = formFieldInputResponse;
            }
        }

        return formRequest;
    };

    var isNumber = function (n) {
        if (n == null) {
            return false;
        } else {
            return !isNaN(parseFloat(n)) && isFinite(n);
        }
    };

    var assignUserPosition = function (domId, position) {
        if (position != null &&
            position.coords != null) {
            var latitude = 0;
            var longitude = 0;
            var accuracy = 0;
            var altitude = 0;
            var altitudeAccuracy = 0;
            var heading = 0;
            var speed = 0;

            if (isNumber(position.coords.latitude) == true) {
                latitude = position.coords.latitude;
            }

            if (isNumber(position.coords.longitude) == true) {
                longitude = position.coords.longitude;
            }

            if (isNumber(position.coords.accuracy) == true) {
                accuracy = position.coords.accuracy;
            }

            if (isNumber(position.coords.altitude) == true) {
                altitude = position.coords.altitude;
            }

            if (isNumber(position.coords.altitudeAccuracy) == true) {
                altitudeAccuracy = position.coords.altitudeAccuracy;
            }

            if (isNumber(position.coords.heading) == true) {
                heading = position.coords.heading;
            }

            if (isNumber(position.coords.speed) == true) {
                speed = position.coords.speed;
            }

            $('#' + domId + '-position-latitude').val(latitude);
            $('#' + domId + '-position-longitude').val(longitude);
            $('#' + domId + '-position-accuracy').val(accuracy);
            $('#' + domId + '-position-altitude').val(altitude);
            $('#' + domId + '-position-altitudeAccuracy').val(altitudeAccuracy);
            $('#' + domId + '-position-heading').val(heading);
            $('#' + domId + '-position-speed').val(speed);
        }
    };

    var trackUserPosition = function (domId) {
        navigator.geolocation.getCurrentPosition(function (position) {
                                                     assignUserPosition(domId, position);
                                                 }, 
                                                 null,
                                                 {timeout:60000});
    };

    var runFlow = function (domId) {
        var stateId = $('#' + domId + '-state-id').val();
        var flowId = $('#' + domId + '-flow-id').val();
        var flowVersionId = $('#' + domId + '-flow-version-id').val();

        // If the state is not null or blank, then we're joining
        if (stateId != null &&
            stateId.trim().length > 0) {
            join(domId);
        // If the state is null, then we're running an actual flow
        } else if (flowId != null &&
                   flowId.trim().length > 0) {
            initializeFlow(domId);
        // If we don't have anything to do, we tell the user
        } else {
            alert('Nothing to do!');
        }
    };

    // Create the setup function
    var requestAuthentication = function (domId, loginUrl) {
        var sessionId = null;

        sessionId = $('#' + domId + '-session-id').val();

        if (sessionId != null &&
            sessionId.trim().length > 0) {
            // Grab the session id and sessionurl here and do an automated login from the player
            ManyWhoFlow.loginBySession("Engine.RequestAuthentication", 
                                       $('#' + domId + '-tenant-id').val(),
                                       loginUrl,
                                       sessionId,
                                       $('#' + domId + '-session-url').val(),
                                       null,
                                       function (data, status, xhr) {
                                           // The data is the authentication token
                                           ManyWhoSharedServices.setAuthenticationToken(data);

                                           // Update the tools menu
                                           runFlow.call(this, domId);
                                       },
                                       manageError(domId));
        } else {
            ManyWhoSharedServices.showAuthenticationDialog(function (authenticationToken) {
                ManyWhoSharedServices.setAuthenticationToken(authenticationToken);

                // Update the tools menu
                runFlow.call(this, domId);
            },
            loginUrl,
            $('#' + domId + '-tenant-id').val());
        }
    };

    // Creates the data tree needed for the debug view
    //
    var createDataTreeFromEngineValues = function (engineValues) {
        var data = null;
        var entries = null;
        var entry = null;

        if (engineValues != null &&
            engineValues.length > 0) {
            data = new Object();
            entries = new Array();

            for (var i = 0; i < engineValues.length; i++) {
                entry = new Object();
                entry.data = engineValues[i].developerName + ' (' + engineValues[i].contentType + ')';
                
                if (engineValues[i].contentType == ManyWhoConstants.CONTENT_TYPE_OBJECT ||
                    engineValues[i].contentType == ManyWhoConstants.CONTENT_TYPE_LIST) {
                    if (engineValues[i].objectData != null &&
                        engineValues[i].objectData.length > 0) {
                        entry.children = createTreeDataFromObjectDataArray(engineValues[i].objectData);
                    } else {
                        entry.children = new Array();
                        entry.children[0] = 'null';
                    }
                } else {
                    entry.children = new Array();
                    entry.children[0] = engineValues[i].contentValue;
                }

                // Add the entry to the data array
                entries[entries.length] = entry;
            }

            // Assign the entries to the data
            data.data = entries;
        }

        return data;
    };

    var createAlert = function (domId) {
        var html = '';

        html += '<div id="' + domId + '-debug-alert" class="alert">';
        html += '<button type="button" class="close" data-dismiss="alert">&times;</button>';
        html += '<h4>Debug Info</h4>';
        html += '<h5>Pre-Commit State Values</h5>';
        html += '<div id="' + domId + '-debug-precommit-state-values"></div>';
        html += '<h5>State Values</h5>';
        html += '<div id="' + domId + '-debug-state-values"></div>';
        html += '</div>';

        return html;
    };

    var createTreeDataFromObjectDataArray = function (objectDataArray) {
        var children = null;
        var child = null;
        var property = null;

        if (objectDataArray != null &&
            objectDataArray.length > 0) {
            children = new Array();

            for (var i = 0; i < objectDataArray.length; i++) {
                var objectData = objectDataArray[i];

                child = new Object();
                child.data = objectData.typeDeveloperName;

                if (objectData.properties != null &&
                    objectData.properties.length > 0) {
                    child.children = new Array();

                    for (var j = 0; j < objectData.properties.length; j++) {
                        var propertyData = objectData.properties[j];

                        property = new Object();
                        property.data = propertyData.developerName;

                        if (propertyData.objectData != null &&
                            propertyData.objectData.length > 0) {
                            property.children = createTreeDataFromObjectDataArray(propertyData.objectData);
                        } else if (propertyData.contentValue != null &&
                                   propertyData.contentValue.trim().length > 0) {
                            property.children = new Array();
                            property.children[0] = propertyData.contentValue;
                        } else {
                            property.children = new Array();
                            property.children[0] = 'null';
                        }

                        child.children[child.children.length] = property;
                    }
                }

                children[children.length] = child;
            }
        }

        return children;
    };

    var methods = {
        init: function (options) {
            var html = null;
            var domId = $(this).attr('id');

            var opts = $.extend({}, $.fn.manywhoRuntimeEngine.defaults, options);

            html = '';

            // Initialize the shared services
            ManyWhoSharedServices.initialize('shared-services');

            // Dialog for sharing the flow with other users
            html += '<div id="' + domId + '-share-flow-dialog" class="modal hide fade">';
            html += '    <div class="modal-header">';
            html += '        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>';
            html += '        <h3 id="manywho-share-flow-dialog-title">Share</h3>';
            html += '    </div>';
            html += '    <div class="modal-body">';
            html += '        <div class="row-fluid">';
            html += '            <textarea id="' + domId + '-share-post-text" placeholder="Share this flow with your colleagues" class="span12 typeahead elastic"></textarea>';
            html += '        </div>';
            html += '    </div>';
            html += '    <div class="modal-footer">';
            html += '        <button id="' + domId + '-share-post-button" class="btn btn-success">Share</button>';
            html += '        <button id="' + domId + '-cancel-post-button" class="btn">Cancel</button>';
            html += '    </div>';
            html += '</div>';

            // The buttons for following the flow and refreshing the feed
            html += '<div id="' + domId + '-social-feed-buttons" class="container-fluid">';
            html += '    <div class="row-fluid">';
            html += '        <div class="span12">';
            html += '            <div class="pull-right">';
            html += '                <button id="' + domId + '-follow-flow-button" class="btn btn-success">Loading...</button>';
            html += '                <button id="' + domId + '-share-flow-button" class="btn btn-info"><i class="icon-heart icon-white"></i> Share</button>';
            html += '                <button id="' + domId + '-update-feed" class="btn btn-primary"><i class="icon-refresh icon-white"></i> Update Feed</button>';
            html += '            </div>';
            html += '        </div>';
            html += '    </div>';
            html += '</div>';

            html += '<div id="' + domId + '-system-faults" class="container-fluid">';
            html += '</div>';

            html += '<div id="' + domId + '-root-faults" class="container-fluid">';
            html += '</div>';

            html += '<div id="' + domId + '-screen-content" class="container-fluid">';
            html += '</div>';

            // The span for the flow followers
            html += '<div id="' + domId + '-social-feed-followers" class="container-fluid" style="display: none;">';
            html += '    <div class="row-fluid">';
            html += '        <div id="' + domId + '-followers" class="span12 well well-small"></div>';
            html += '    </div>';
            html += '</div>';

            // The span for the actual feed
            html += '<div id="' + domId + '-social-feed"></div>';

            html += '<div id="' + domId + '-wait-indicator" class="active manywho-wait">';
            html += '    <div class="progress progress-striped active">';
            html += '        <div class="bar" style="width: 100%;"></div>';
            html += '    </div>';
            html += '    <p align="center" class="muted" id="' + domId + '-wait-indicator-message"></p>';
            html += '</div>';

            html += '<div style="display:none;" id="' + domId + '-inputs-database"></div>';
            html += '<div style="display:none;" id="' + domId + '-viewstate-database"></div>';

            html += '<input type="hidden" id="' + domId + '-engine-url" value="" />';
            html += '<input type="hidden" id="' + domId + '-flow-id" value="" />';
            html += '<input type="hidden" id="' + domId + '-flow-version-id" value="" />';
            html += '<input type="hidden" id="' + domId + '-state-id" value="" />';
            html += '<input type="hidden" id="' + domId + '-state-token" value="" />';
            html += '<input type="hidden" id="' + domId + '-element-id" value="" />';
            html += '<input type="hidden" id="' + domId + '-tenant-id" value="" />';
            html += '<input type="hidden" id="' + domId + '-mode" value="" />';
            html += '<input type="hidden" id="' + domId + '-session-id" value="" />';
            html += '<input type="hidden" id="' + domId + '-session-url" value="" />';
            html += '<input type="hidden" id="' + domId + '-rewrite-url" value="" />';
            html += '<input type="hidden" id="' + domId + '-stream-thread-id" value="" />';
            html += '<input type="hidden" id="' + domId + '-join-thread-id" value="" />';
            html += '<input type="hidden" id="' + domId + '-sync-thread-id" value="" />';
            html += '<input type="hidden" id="' + domId + '-recording-settings-id" value="" />';
            html += '<input type="hidden" id="' + domId + '-recording-settings-mode" value="" />';
            html += '<input type="hidden" id="' + domId + '-recording-name" value="" />';
            html += '<input type="hidden" id="' + domId + '-outcome-panel" value="" />';
            html += '<input type="hidden" id="' + domId + '-form-label-panel" value="" />';
            html += '<input type="hidden" id="' + domId + '-position-latitude" value="0" />';
            html += '<input type="hidden" id="' + domId + '-position-longitude" value="0" />';
            html += '<input type="hidden" id="' + domId + '-position-accuracy" value="0" />';
            html += '<input type="hidden" id="' + domId + '-position-altitude" value="0" />';
            html += '<input type="hidden" id="' + domId + '-position-altitudeAccuracy" value="0" />';
            html += '<input type="hidden" id="' + domId + '-position-heading" value="0" />';
            html += '<input type="hidden" id="' + domId + '-position-speed" value="0" />';

            html += '<div id="' + domId + '-debug">';
            html += '</div>';

            // Write the html to the parent element
            $(this).html(html);

            // Make sure we register the share dialog as a dialog
            $('#' + domId + '-share-flow-dialog').modalmanager({ backdrop: false });

            $('#' + domId + '-share-flow-button').click(function (event) {
                event.preventDefault();
                $('#' + domId + '-share-flow-dialog').modal('show');
            });

            // Create the alert html
            $('#' + domId + '-debug').html(createAlert(domId));

            // Put an event on the debug info so if the user closes it, we stop sending the debug mode through
            $('#' + domId + '-debug-alert').bind('close', function () {
                // Blank out the mode so we're no longer doing the step-through
                $('#' + domId + '-mode').val('');
            })

            // Hide the debug panel
            $('#' + domId + '-debug').hide();

            // Hide the feed control buttons
            $('#' + domId + '-social-feed-buttons').hide();

            // Hide the followers list
            $('#' + domId + '-social-feed-followers').hide();

            // Start by hiding the wait
            hideWait(domId);

            $('#' + domId + '-engine-url').val(ManyWhoConstants.BASE_PATH_URL + '/api/run/1');
            $('#' + domId + '-tenant-id').val(opts.tenantId);
            $('#' + domId + '-rewrite-url').val(opts.rewriteUrl);

            // If the user clicks the cancel button, we hide the sharing modal dialog
            $('#' + domId + '-cancel-post-button').click(function (event) {
                event.preventDefault();
                $('#' + domId + '-share-flow-dialog').modal('hide');
            });
        },
        run: function (stateId, flowId, flowVersionId, inputs, doneCallbackFunction, outcomePanel, formLabelPanel, annotations, mode, sessionId, sessionUrl) {
            var domId = $(this).attr('id');

            // Make the outcome panel blank if it's null
            if (outcomePanel == null) {
                outcomePanel = '';
            }

            if (formLabelPanel == null) {
                formLabelPanel = '';
            }

            if (mode == null) {
                mode = '';
            }

            if (flowVersionId == null) {
                flowVersionId = '';
            }

            // Set the done callback function to the provided value
            //doneCallback = doneCallbackFunction;

            // Clear the values so we don't get bleeding if the browser caches anything
            $('#' + domId + '-flow-id').val('');
            $('#' + domId + '-flow-version-id').val('');
            $('#' + domId + '-state-id').val('');
            $('#' + domId + '-state-token').val('');
            $('#' + domId + '-element-id').val('');
            $('#' + domId + '-recording-settings-id').val('');
            $('#' + domId + '-recording-settings-mode').val('');
            $('#' + domId + '-recording-name').val('');
            $('#' + domId + '-outcome-panel').val('');
            $('#' + domId + '-form-label-panel').val('');
            $('#' + domId + '-mode').val('');

            // Store the values in the dom
            $('#' + domId + '-state-id').val(stateId);
            $('#' + domId + '-flow-id').val(flowId);
            $('#' + domId + '-flow-version-id').val(flowVersionId);
            $('#' + domId + '-outcome-panel').val(outcomePanel);
            $('#' + domId + '-form-label-panel').val(formLabelPanel);
            $('#' + domId + '-mode').val(mode);
            $('#' + domId + '-session-id').val(sessionId);
            $('#' + domId + '-session-url').val(sessionUrl);

            if (inputs == null) {
                // Try getting the inputs from the query string input parameters
                inputs = ManyWhoUtils.getInputQueryStringParams();
            }

            // Store the inputs in the page database
            $('#' + domId + '-inputs-database').data('inputs', inputs);
            $('#' + domId + '-inputs-database').data('annotations', annotations);
            $('#' + domId + '-inputs-database').data('doneCallback', doneCallbackFunction);

            if (mode == ManyWhoConstants.MODE_DEBUG ||
                mode == ManyWhoConstants.MODE_DEBUG_STEPTHROUGH) {
                // Create the alert html just in case it has been deleted
                //$('#' + domId + '-debug').html(createAlert(domId));

                //// Put an event on the debug info so if the user closes it, we stop sending the debug mode through
                //$('#' + domId + '-debug-alert').bind('close', function () {
                //    // Blank out the mode so we're no longer doing the step-through
                //    $('#' + domId + '-mode').val('');
                //})

                // Show the debug panel
                $('#' + domId + '-debug').show();
            } else {
                // Hide the debug panel
                $('#' + domId + '-debug').hide();
            }

            // Finally, we grab the geo location
            if (navigator.geolocation){
                // timeout at 60000 milliseconds (60 seconds)
                var options = {timeout:1000};

                // Tell the user we're trying to find their location                
                showWait(domId, 'Finding your location...');

                // Get the navigator current position
                navigator.geolocation.getCurrentPosition(function (position) {
                                                             // Hide the finding wait message
                                                             hideWait(domId);

                                                             // Grab the position data so we have the geo location of our user
                                                             assignUserPosition(domId, position);
                    
                                                             // Run the requested flow
                                                             runFlow(domId);

                                                             // Kick off a thread to keep the location data up-to-date
                                                             $('#' + domId + '-sync-thread-id').val(setInterval(function () { trackUserPosition(domId); }, 60000));
                                                         }, 
                                                         function () {
                                                             // Hide the finding wait message
                                                             hideWait(domId);

                                                             // Run the requested flow - we had an error grabbing geo location
                                                             runFlow(domId);
                                                         },
                                                         options);
            } else {
                // Run the requested flow - geo location is not supported
                runFlow(domId);
            }
        },
        clear: function () {
            var domId = $(this).attr('id');

            // Stop all sync operations
            clearInterval($('#' + domId + '-sync-thread-id').val());
            clearInterval($('#' + domId + '-join-thread-id').val());

            // Destroy the boostrap form
            $('#' + domId + '-screen-content').manywhoFormBootStrap('destroy');
        }
    };

    $.fn.manywhoRuntimeEngine = function (method) {
        // Method calling logic
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.manywhoRuntimeEngine');
        }
    };

    // Option default values
    $.fn.manywhoRuntimeEngine.defaults = { rewriteUrl: true };

})(jQuery);