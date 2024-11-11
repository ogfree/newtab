import { NextResponse } from 'next/server'

const API_KEY = process.env.OPENWEATHERMAP_API_KEY

if (!API_KEY) {
  console.error('OPENWEATHERMAP_API_KEY is not set in the environment variables')
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 })
  }

  try {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    console.log('Fetching weather data from:', apiUrl)

    const response = await fetch(apiUrl)
    const data = await response.json()

    if (data.cod !== 200) {
      console.error('OpenWeatherMap API error:', data)
      throw new Error(`OpenWeatherMap API error: ${data.message || 'Unknown error'}`)
    }

    const weather = {
      temp: Math.round(data.main.temp),
      condition: getCondition(data.weather[0].id)
    }

    return NextResponse.json(weather)
  } catch (error) {
    console.error('Error fetching weather:', error)
    return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: 500 })
  }
}

function getCondition(id: number): 'sunny' | 'cloudy' | 'rainy' {
  if (id >= 200 && id < 600) {
    return 'rainy'
  } else if (id >= 600 && id < 700) {
    return 'cloudy'
  } else if (id === 800) {
    return 'sunny'
  } else {
    return 'cloudy'
  }
}