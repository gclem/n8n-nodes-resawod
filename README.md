# n8n-nodes-resawod

![n8n.io - Workflow Automation](https://raw.githubusercontent.com/n8n-io/n8n/master/assets/n8n-logo.png)

This is an n8n community node that lets you use the Resawod/Nubapp API in your n8n workflows.

Resawod is a fitness and sports booking platform powered by Nubapp that allows users to book classes, manage reservations, and join waiting lists for various sports activities.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

## Table of Contents

- [Installation](#installation)
- [Operations](#operations)
  - [Slot Operations](#slot-operations)
  - [Booking Operations](#booking-operations)
- [Credentials](#credentials)
- [Compatibility](#compatibility)
- [Usage](#usage)
  - [Example Workflows](#example-workflows)
- [Development](#development)
- [Resources](#resources)
- [Version History](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

### Community Node Installation

1. Go to **Settings > Community Nodes** in your n8n instance
2. Select **Install**
3. Enter `n8n-nodes-resawod` in the **Enter npm package name** field
4. Click **Install**

### Manual Installation

To install manually, navigate to your n8n installation and run:

```bash
npm install n8n-nodes-resawod
```

## Operations

### Slot Operations

#### Get Many Slots
Retrieve available activity slots within a date range.

**Parameters:**
- `Start Date` (required): Starting date for the search
- `Number of Days` (required): Number of days to search from the start date (default: 7, range: 1-365)

**Returns:** List of available activity slots with details including:
- Activity calendar ID
- Activity name and description
- Date and time
- Available spots
- Instructor information

### Booking Operations

#### Create
Book an available activity slot.

**Parameters:**
- `Activity Calendar ID` (required): The ID of the slot to book

**Returns:** Booking confirmation with details

#### Join Waiting List
Join the waiting list for a full activity slot.

**Parameters:**
- `Activity Calendar ID` (required): The ID of the slot to join the waiting list

**Returns:** Waiting list confirmation

#### Cancel
Cancel an existing confirmed booking.

**Parameters:**
- `Activity Calendar ID` (required): The ID of the booking to cancel

**Returns:** Cancellation confirmation

#### Cancel Waiting List
Remove yourself from a waiting list.

**Parameters:**
- `Activity Calendar ID` (required): The ID of the waiting list entry to cancel

**Returns:** Removal confirmation

#### Get Future Booking
Retrieve your upcoming bookings and waiting list entries.

**Parameters:**
- `Limit` (optional): Maximum number of bookings to retrieve (default: 50, range: 1-100)

**Returns:** List of future bookings with details including:
- Booking status (confirmed/waiting list)
- Activity details
- Date and time
- Check-in status

## Credentials

To use this node, you need a Resawod/Nubapp account with the following credentials:

### Required Fields

1. **Username**: Your Resawod login username
2. **Password**: Your Resawod login password
3. **Application ID**: The ID of your fitness center/application (e.g., 74239463)
4. **Category Activity ID**: The ID of the activity category you want to book (e.g., 2179)

### How to Get Your Credentials

1. **Username & Password**: Use your regular Resawod login credentials from [box.resawod.com](https://box.resawod.com)

2. **Application ID & Category Activity ID**: 
   - These can be found in the URL or API requests when browsing your Resawod account
   - Connect to your application and inspect request to find the matching id 

### Setting Up Credentials in n8n

1. In your n8n workflow, add a Resawod node
2. Click on the **Credential to connect with** dropdown
3. Click **Create New**
4. Fill in all required fields:
   - Username
   - Password
   - Application ID
   - Category Activity ID
5. Click **Save**
6. Test the connection by clicking **Test** button

The node will automatically:
- Authenticate with the Resawod/Nubapp API
- Obtain the necessary JWT tokens
- Manage token refresh for subsequent requests

## Compatibility

- Minimum n8n version: **1.0.0**
- Tested against n8n versions: **1.0.0+**
- Uses n8n workflow API version: **1**

## Usage

### Date Format

When using the **Get Many Slots** operation, dates can be provided in the following formats:
- ISO format: `YYYY-MM-DD` (e.g., `2026-01-04`)
- European format: `DD-MM-YYYY` (e.g., `04-01-2026`)
- n8n dateTime picker format

The node automatically handles date parsing and converts them to the required API format.

### Example Workflows

#### 1. Daily Automatic Booking

Automatically book your favorite class every day:

```
Cron → Resawod (Get Many Slots) → Filter (by activity name) → Resawod (Create Booking)
```

#### 2. Waiting List Monitor

Monitor waiting lists and book when a spot becomes available:

```
Cron → Resawod (Get Future Booking) → Filter (waiting list) → Resawod (Get Many Slots) → IF (spot available) → Resawod (Cancel Waiting List + Create Booking)
```

#### 3. Booking Notification

Get notified when your bookings are confirmed:

```
Cron → Resawod (Get Future Booking) → Filter (new bookings) → Email/Slack/Discord
```

### Tips

- Use the **Get Many Slots** operation to find available `Activity Calendar ID` values
- The `Number of Days` parameter allows you to search for slots up to 365 days in advance
- Future bookings include both confirmed reservations and waiting list entries
- All operations use the same authentication, so you only need to configure credentials once

## Development

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- n8n installed globally or locally for testing

### Setup

1. Clone the repository:
```bash
git clone https://github.com/giovanniclement/n8n-nodes-resawod.git
cd n8n-nodes-resawod
```

2. Install dependencies:
```bash
npm install
```

3. Build the node:
```bash
npm run build
```

### Available Scripts

- `npm run build` - Build the node
- `npm run build:watch` - Build and watch for changes
- `npm run dev` - Run in development mode with n8n
- `npm run lint` - Lint the code
- `npm run lint:fix` - Lint and fix issues
- `npm run release` - Create a new release

### Project Structure

```
n8n-nodes-resawod/
├── credentials/
│   ├── ResawodApi.credentials.ts    # Credential configuration
│   └── resawod.svg                   # Credential icon
├── nodes/
│   └── Resawod/
│       ├── Resawod.node.ts          # Main node implementation
│       ├── Resawod.node.json        # Node metadata
│       └── resawod.svg              # Node icon
├── services/
│   └── ResawodApiService.ts         # API service layer
├── dist/                            # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

### Service Layer

The node uses a clean architecture with a service layer (`ResawodApiService`) that handles:
- Authentication flow (login → get sport token)
- API requests with proper headers and formatting
- Date formatting and validation
- Centralized API endpoints and constants

### Testing Locally

Link the node to your local n8n installation:

```bash
# In the node directory
npm run build
npm link

# In your n8n directory
npm link n8n-nodes-resawod

# Start n8n
n8n start
```

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Resawod Platform](https://box.resawod.com)
- [Nubapp Documentation](https://nubapp.com)
- [GitHub Repository](https://github.com/giovanniclement/n8n-nodes-resawod)

## Version History

### 0.1.0 (Current)

Initial release with the following features:

**Slot Operations:**
- Get Many Slots with flexible date range

**Booking Operations:**
- Create booking
- Join waiting list
- Cancel booking
- Cancel waiting list entry
- Get future bookings

**Features:**
- Full authentication flow with Resawod/Nubapp API
- Automatic token management
- Service layer architecture for maintainability
- Support for multiple date formats
- Comprehensive error handling

## License

[MIT](LICENSE)

## Author

Giovanni Clement

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/giovanniclement/n8n-nodes-resawod/issues) on GitHub.
