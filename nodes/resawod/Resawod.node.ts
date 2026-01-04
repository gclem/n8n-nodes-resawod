import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	IDataObject,
} from 'n8n-workflow';
import { ResawodApiService, ResawodCredentials } from '../../services/ResawodApiService';

export class Resawod implements INodeType {
	description: INodeTypeDescription = {
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
			// Slot: Get All Properties
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
			// Booking: Create Properties
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
			// Booking: Get Future Properties
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

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		const credentials = await this.getCredentials('resawodApi') as unknown as ResawodCredentials;

		for (let i = 0; i < items.length; i++) {
			try {
				// Authenticate using the centralized service
				const { nubappToken, idUser } = await ResawodApiService.authenticate(
					credentials,
					this.helpers.httpRequest,
				);

				if (resource === 'slot') {
					if (operation === 'getAll') {
						const start = this.getNodeParameter('start', i) as string;
						const end = this.getNodeParameter('end', i) as string;

						const response = await ResawodApiService.getActivitiesCalendar(
							nubappToken,
							credentials.applicationId,
							credentials.categoryActivityId,
							idUser,
							start,
							end,
							this.helpers.httpRequest,
						);

						returnData.push({ json: response as IDataObject });
					}
				} else if (resource === 'booking') {
					if (operation === 'create') {
						// TODO: Find correct v4 endpoint for booking
						throw new NodeOperationError(this.getNode(), 'Booking creation is currently not supported in v4 API', { itemIndex: i });
					} else if (operation === 'getFutureBooking') {
						const limit = this.getNodeParameter('limit', i) as number;

						const response = await ResawodApiService.getUserFutureBookings(
							nubappToken,
							credentials.applicationId,
							idUser,
							limit,
							this.helpers.httpRequest,
						);

						returnData.push({ json: response as IDataObject });
					}
				}

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message } });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error);
			}
		}

		return [returnData];
	}
}
