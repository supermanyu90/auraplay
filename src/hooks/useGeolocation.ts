import { useCallback, useState } from 'react'

export interface GeolocationState {
  latitude: number | null
  longitude: number | null
  error: string | null
  isLoading: boolean
}

const INITIAL_STATE: GeolocationState = {
  latitude: null,
  longitude: null,
  error: null,
  isLoading: false,
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>(INITIAL_STATE)

  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by this browser.',
        isLoading: false,
      }))
      return
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          isLoading: false,
        })
      },
      (err) => {
        let message: string
        switch (err.code) {
          case err.PERMISSION_DENIED:
            message =
              'Location permission was denied. You can still search by city instead, or enable location in your browser settings.'
            break
          case err.POSITION_UNAVAILABLE:
            message = 'Your location is currently unavailable. Try again in a moment.'
            break
          case err.TIMEOUT:
            message = 'Locating you took too long. Please try again.'
            break
          default:
            message = 'Could not determine your location.'
        }
        setState({ latitude: null, longitude: null, error: message, isLoading: false })
      },
      { timeout: 10_000, maximumAge: 60_000, enableHighAccuracy: false },
    )
  }, [])

  return { ...state, requestLocation }
}
