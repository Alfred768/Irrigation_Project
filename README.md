
# Irrigation_Project

# Irrigation Forecast & Decision Platform

This project aims to help farmers scientifically plan irrigation schedules by integrating weather data, soil moisture monitoring, and crop water requirement models. The system offers intelligent irrigation forecasting, real-time soil moisture detection, crop water threshold evaluation, and supports flexible deployment with persistent data storage.

---

## Features

- **Weather Data Fetching & Forecasting**  
  Integrated with OpenWeatherMap API to retrieve real-time and forecasted weather data including precipitation, temperature, wind speed, and evaporation.

- **Soil Moisture Monitoring**  
  Uses AgroMonitoring API to fetch soil moisture data for specific plots, combined with custom models to dynamically estimate soil water content.

- **Crop Water Requirement Model**  
  Supports multiple crops with defined critical moisture, optimal moisture, and daily water use parameters to calculate irrigation needs based on weather and soil data.

- **Automated Irrigation Scheduling**  
  Analyzes soil moisture trends and weather forecasts to determine irrigation necessity and volume, generating a scientifically optimized irrigation plan.

- **Data Storage & Management**  
  Uses Drizzle ORM with PostgreSQL to manage irrigation forecasts, weather data, and irrigation schedules.

- **AI Chatbot Assistance (Optional)**  
  Integrated with DeepSeek API to provide AI-powered agricultural consultation and irrigation advice.

---

## Getting Started

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
AGRO_API_KEY=your_agro_monitoring_api_key
OPENWEATHER_API_KEY=your_openweathermap_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key  # Optional
DATABASE_URL=your_postgres_database_url
```

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/irrigation_project.git
   cd irrigation_project
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up your PostgreSQL database and update `DATABASE_URL` in `.env`.

4. Run database migrations (if any).

5. Start the development server:

   ```bash
   pnpm run dev
   ```

---

## Usage

- Access the API endpoints to create irrigation forecasts, retrieve weather data, and get irrigation schedules.

- The AI chatbot provides intelligent agricultural advice based on forecast data.

---

## API Endpoints

- `POST /api/irrigation-forecast` - Create a new irrigation forecast based on input data.

- `GET /api/irrigation-forecast/:id` - Retrieve irrigation forecast details, weather data, and irrigation schedule.

- `POST /api/chat` - Send a message to the AI assistant with optional forecast context.

---

## Configuration

- `cropThresholds` define critical, optimal soil moisture thresholds and daily water use (mm) for crops such as wheat, corn, soybeans, tomatoes, potatoes, and rice.

- `soilTypes` describe soil water holding capacity and drainage rates for sandy, loam, clay loam, and clay soils.

---

## Contributing

Contributions are welcome! Please submit pull requests or open issues for bug fixes and feature requests.

