"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resawod = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const ResawodApiService_1 = require("../../services/ResawodApiService");
class Resawod {
    constructor() {
        this.description = {
            displayName: 'Resawod',
            name: 'resawod',
            icon: 'file:resawod.svg',
            group: ['transform'],
            version: 1,
            subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
            description: 'Interact with Resawod API',
            documentationUrl: 'https://github.com/loulasedna/Resawod_nubapp',
            defaults: {
                name: 'Resawod',
            },
            inputs: ['main'],
            outputs: ['main'],
            credentials: [
                {
                    name: 'resawodApi',
                    required: true,
                },
            ],
            properties: [
                {
                    displayName: 'Resource',
                    name: 'resource',
                    type: 'options',
                    noDataExpression: true,
                    options: [
                        {
                            name: 'Slot',
                            value: 'slot',
                        },
                        {
                            name: 'Booking',
                            value: 'booking',
                        },
                    ],
                    default: 'slot',
                },
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: {
                        show: {
                            resource: [
                                'slot',
                            ],
                        },
                    },
                    options: [
                        {
                            name: 'Get Many',
                            value: 'getAll',
                            action: 'Get many slots',
                            description: 'Get available slots',
                        },
                    ],
                    default: 'getAll',
                },
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: {
                        show: {
                            resource: [
                                'booking',
                            ],
                        },
                    },
                    options: [
                        {
                            name: 'Create',
                            value: 'create',
                            action: 'Create a booking',
                            description: 'Book a slot',
                        },
                        {
                            name: 'Get Future Booking',
                            value: 'getFutureBooking',
                            action: 'Get future bookings',
                            description: 'Get future bookings for the user',
                        },
                    ],
                    default: 'create',
                },
                {
                    displayName: 'Start Date',
                    name: 'start',
                    type: 'dateTime',
                    default: '',
                    displayOptions: {
                        show: {
                            resource: ['slot'],
                            operation: ['getAll'],
                        },
                    },
                    required: true,
                    description: 'Start date for the search',
                },
                {
                    displayName: 'End Date',
                    name: 'end',
                    type: 'dateTime',
                    default: '',
                    displayOptions: {
                        show: {
                            resource: ['slot'],
                            operation: ['getAll'],
                        },
                    },
                    required: true,
                    description: 'End date for the search',
                },
                {
                    displayName: 'Activity Calendar ID',
                    name: 'activityCalendarId',
                    type: 'string',
                    default: '',
                    displayOptions: {
                        show: {
                            resource: ['booking'],
                            operation: ['create'],
                        },
                    },
                    required: true,
                    description: 'The ID of the activity calendar to book',
                },
                {
                    displayName: 'Limit',
                    name: 'limit',
                    type: 'number',
                    default: 50,
                    typeOptions: {
                        minValue: 1,
                        maxValue: 100,
                    },
                    displayOptions: {
                        show: {
                            resource: ['booking'],
                            operation: ['getFutureBooking'],
                        },
                    },
                    description: 'Max number of results to return',
                },
            ],
            usableAsTool: true,
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        const resource = this.getNodeParameter('resource', 0);
        const operation = this.getNodeParameter('operation', 0);
        const credentials = await this.getCredentials('resawodApi');
        for (let i = 0; i < items.length; i++) {
            try {
                const { nubappToken, idUser } = await ResawodApiService_1.ResawodApiService.authenticate(credentials, this.helpers.httpRequest);
                if (resource === 'slot') {
                    if (operation === 'getAll') {
                        const start = this.getNodeParameter('start', i);
                        const end = this.getNodeParameter('end', i);
                        const response = await ResawodApiService_1.ResawodApiService.getActivitiesCalendar(nubappToken, credentials.applicationId, credentials.categoryActivityId, idUser, start, end, this.helpers.httpRequest);
                        returnData.push({ json: response });
                    }
                }
                else if (resource === 'booking') {
                    if (operation === 'create') {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Booking creation is currently not supported in v4 API', { itemIndex: i });
                    }
                    else if (operation === 'getFutureBooking') {
                        const limit = this.getNodeParameter('limit', i);
                        const response = await ResawodApiService_1.ResawodApiService.getUserFutureBookings(nubappToken, credentials.applicationId, idUser, limit, this.helpers.httpRequest);
                        returnData.push({ json: response });
                    }
                }
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({ json: { error: error.message } });
                    continue;
                }
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), error);
            }
        }
        return [returnData];
    }
}
exports.Resawod = Resawod;
//# sourceMappingURL=Resawod.node.js.map