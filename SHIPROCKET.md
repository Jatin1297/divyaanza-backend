# Shiprocket integration (production guide)

This project includes a minimal backend integration for Shiprocket:

- Login/token caching
- Create adhoc order (shipment) for an existing local Order
- Assign AWB to a shipment
- Track shipment by AWB

## 1) Get Shiprocket API credentials

From your Shiprocket dashboard / developer settings, get the API login:

- `SHIPROCKET_EMAIL`
- `SHIPROCKET_PASSWORD`

## 2) Required `.env` variables (backend)

Add these to `backend/.env`:

```env
SHIPROCKET_EMAIL=your_api_email
SHIPROCKET_PASSWORD=your_api_password

# Pickup location name configured in Shiprocket
SHIPROCKET_PICKUP_LOCATION=Delhi Aruna Nagar

# If your address parsing is simple in your app,
# set defaults to avoid Shiprocket rejecting payload.
SHIPROCKET_DEFAULT_CITY=Delhi
SHIPROCKET_DEFAULT_STATE=Delhi
SHIPROCKET_DEFAULT_PINCODE=110054

# Parcel dimensions (cm)
SHIPROCKET_DEFAULT_LENGTH=10
SHIPROCKET_DEFAULT_BREADTH=10
SHIPROCKET_DEFAULT_HEIGHT=5
```

Important:
- Do **not** commit secrets to git.
- Ensure your pickup location name matches Shiprocket exactly.

## 3) API endpoints added

Base: `/api/shiprocket`

### Create shipment for local order (admin-only)

`POST /api/shiprocket/order/:id/create`

Creates an adhoc Shiprocket order+shipment for your local Order `:id`. Stores:

- `shiprocketOrderId`
- `shiprocketShipmentId`

### Assign AWB (admin-only)

`POST /api/shiprocket/order/:id/assign-awb`

Body (optional):

```json
{ "courier_id": 123 }
```

Stores:

- `shiprocketAwbCode`
- `shiprocketCourierName`

### Track by AWB (public)

`GET /api/shiprocket/track/:awb`

Returns Shiprocket tracking payload.

## 4) Notes / production readiness

- Token caching is implemented in `backend/utils/shiprocket.js`.
- Address fields in Shiprocket payload currently use local `shippingAddress` and some defaults.
  For best results, store address in structured format (address line/city/state/pincode) in your Order schema.
- Weight handling: product `weight` is used in Shiprocket payload. Ensure your unit matches what your Shiprocket account expects.
- Add a webhook receiver if you want automatic status syncing (Shiprocket supports webhooks).

