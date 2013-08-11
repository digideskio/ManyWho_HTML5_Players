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

var ManyWhoLogging = {

    /*
     * Wrapper method for the standard console logging behaviour.  We use this wrapper so we can disable
     * logging when necessary - but also add extra behaviours over time.
     */
    consoleLog: function (log) {
        if (console != undefined) {
            console.log(log);
        }
    },

    /*
     * Wrapper method for the standard console logging behaviour.  We use this wrapper so we can disable
     * logging when necessary - but also add extra behaviours over time.
     */
    consoleError: function (error) {
        if (console != undefined) {
            console.error(error);
        }
    }
}