import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

// import { OptionsWithUri } from 'request';

export class Resawod implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Resawod',
		name: 'resawod',
		icon: 'file:resawod.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Resawod API',
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
						name: 'Get Future',
						value: 'getFuture',
						action: 'Get future bookings',
						description: 'Get future bookings',
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
		],
		usableAsTool: true,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		const credentials = await this.getCredentials('resawod');
		const username = credentials.username as string;
		const password = credentials.password as string;
		const applicationId = credentials.applicationId as string;
		const categoryActivityId = credentials.categoryActivityId as string;

		// --- Helper: Login and get cookies (Legacy) ---
		const login = async () => {
			// 1. Get Session ID (Cookie Checker)
			const cookieCheckerOptions: any = {
				method: 'GET',
				uri: 'https://sport.nubapp.com/web/cookieChecker.php',
				qs: {
					id_application: applicationId,
					isIframe: 'false',
				},
				headers: {
					'authority': 'sport.nubapp.com',
					'pragma': 'no-cache',
					'cache-control': 'no-cache',
					'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
					'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
					'referer': `https://sport.nubapp.com/web/setApplication.php?id_application=${applicationId}`,
					'cookie': `applicationId=${applicationId}`,
				},
				resolveWithFullResponse: true,
				json: false,
			};

			const cookieCheckerResponse = await this.helpers.request(cookieCheckerOptions);
			const cookies = cookieCheckerResponse.headers['set-cookie'] || [];
			
			const cookieHeader = cookies.map((c: string) => c.split(';')[0]).join('; ');

			// 2. Login
			const loginOptions: any = {
				method: 'POST',
				uri: 'https://sport.nubapp.com/web/ajax/users/checkUser.php',
				form: {
					username: username,
					password: password,
				},
				headers: {
					'authority': 'sport.nubapp.com',
					'pragma': 'no-cache',
					'cache-control': 'no-cache',
					'accept': 'application/json, text/plain, */*',
					'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
					'content-type': 'application/x-www-form-urlencoded',
					'origin': 'https://sport.nubapp.com',
					'referer': 'https://sport.nubapp.com/web/index.php',
					'cookie': `${cookieHeader}; applicationId=${applicationId}`,
				},
				resolveWithFullResponse: true,
				json: true,
			};

			const loginResponse = await this.helpers.request(loginOptions);
			
			const loginCookies = loginResponse.headers['set-cookie'] || [];
			const allCookies = [...cookies, ...loginCookies];
			const finalCookieHeader = allCookies.map((c: string) => c.split(';')[0]).join('; ');

			return {
				cookieHeader: `${finalCookieHeader}; applicationId=${applicationId}`,
				loginData: loginResponse.body,
			};
		};

		// --- Helper: Login with JWT (New Flow) ---
		const loginJwt = async () => {
			// 1. Login to Resasocial to get JWT
			const loginOptions: any = {
				method: 'POST',
				uri: 'https://api.resasocial.com/user/login',
				body: {
					username: username,
					password: password,
				},
				headers: {
					'Content-Type': 'application/json',
					'Origin': 'https://box.resawod.com',
					'Referer': 'https://box.resawod.com/',
				},
				json: true,
			};
			const loginResponse = await this.helpers.request(loginOptions);
			const token = loginResponse.token || loginResponse.jwt_token;

			// 2. Get User to initialize session and get User ID
			const getUserOptions: any = {
				method: 'POST',
				uri: 'https://sport.nubapp.com/api/v4/users/getUser.php',
				form: {
					app_version: '5.12.03',
					registration_type: '2',
					'fields[]': 'dob',
					id_application: applicationId,
				},
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/x-www-form-urlencoded',
					'nubapp-origin': 'user_apps',
					'Origin': 'https://box.resawod.com',
					'Referer': 'https://box.resawod.com/',
					'X-Requested-With': 'XMLHttpRequest',
				},
				json: true,
			};
			const userResponse = await this.helpers.request(getUserOptions);
			
			// userResponse should be the user object or contain it.
			// We need the ID.
			const userId = userResponse.id || userResponse.user?.id;

			return { token, userId };
		};

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'slot') {
					const { cookieHeader } = await login();
					if (operation === 'getAll') {
						const start = this.getNodeParameter('start', i) as string;
						const end = this.getNodeParameter('end', i) as string;
						
						const startTimestamp = Math.floor(new Date(start).getTime() / 1000);
						const endTimestamp = Math.floor(new Date(end).getTime() / 1000);
						const nowTimestamp = Math.floor(Date.now() / 1000);

						const options: any = {
							method: 'GET',
							uri: 'https://sport.nubapp.com/web/ajax/activities/getActivitiesCalendar.php',
							qs: {
								id_category_activity: categoryActivityId,
								offset: '-120',
								start: startTimestamp,
								end: endTimestamp,
								_: nowTimestamp,
							},
							headers: {
								'authority': 'sport.nubapp.com',
								'pragma': 'no-cache',
								'cache-control': 'no-cache',
								'accept': 'application/json, text/javascript, */*; q=0.01',
								'x-requested-with': 'XMLHttpRequest',
								'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
								'referer': 'https://sport.nubapp.com/web/index.php',
								'cookie': cookieHeader,
							},
							json: true,
						};

						const response = await this.helpers.request(options);
						returnData.push({ json: response });
					}
				} else if (resource === 'booking') {
					if (operation === 'create') {
						const { cookieHeader } = await login();
						const activityCalendarId = this.getNodeParameter('activityCalendarId', i) as string;

						const options: any = {
							method: 'POST',
							uri: 'https://sport.nubapp.com/web/ajax/activities/bookItem.php',
							form: {
								'items[activities][0][id_activity_calendar]': activityCalendarId,
								'items[activities][0][unit_price]': '0',
								'items[activities][0][n_guests]': '0',
								'items[activities][0][id_resource]': 'false',
								'discount_code': '',
								'payment_method': 'wallet',
								'use_wallet': 'true',
							},
							headers: {
								'authority': 'sport.nubapp.com',
								'pragma': 'no-cache',
								'cache-control': 'no-cache',
								'accept': 'application/json, text/plain, */*',
								'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
								'content-type': 'application/x-www-form-urlencoded',
								'origin': 'https://sport.nubapp.com',
								'x-kl-ajax-request': 'Ajax_Request',
								'referer': 'https://sport.nubapp.com/web/index.php',
								'cookie': cookieHeader,
							},
							json: true,
						};

						const response = await this.helpers.request(options);
						returnData.push({ json: response });
					} else if (operation === 'getFuture') {
						const { token, userId } = await loginJwt();

						const options: any = {
							method: 'POST',
							uri: 'https://sport.nubapp.com/api/v4/users/getUserFutureBookings.php',
							form: {
								app_version: '5.12.03',
								id_application: applicationId,
								id_user: userId,
								limit: 5,
								include_waiting_list: 'true',
							},
							headers: {
								'Authorization': `Bearer ${token}`,
								'Content-Type': 'application/x-www-form-urlencoded',
								'nubapp-origin': 'user_apps',
								'Origin': 'https://box.resawod.com',
								'Referer': 'https://box.resawod.com/',
								'X-Requested-With': 'XMLHttpRequest',
							},
							json: true,
						};

						const response = await this.helpers.request(options);
						returnData.push({ json: response });
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
