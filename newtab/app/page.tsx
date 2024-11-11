'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, X, Sun, Cloud, CloudRain, RefreshCw, ChevronDown, ChevronUp, Loader2, AlertTriangle } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Image from 'next/image'
import { Combobox } from '@headlessui/react'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore'
import { getAuth, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyAtH_AuII0iRTOiQFvIHLxzYGthFyN11fY",
  authDomain: "to-do-5cb01.firebaseapp.com",
  projectId: "to-do-5cb01",
  storageBucket: "to-do-5cb01.firebasestorage.app",
  messagingSenderId: "237781298017",
  appId: "1:237781298017:web:f6c83b033d1efaf447b320",
  measurementId: "G-5P0VK61DSS"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

export default function NewTabPage() {
  const [time, setTime] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [todos, setTodos] = useState<{ id: string; text: string }[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [weather, setWeather] = useState<{ temp: number; condition: 'sunny' | 'cloudy' | 'rainy' } | null>(null)
  const [background, setBackground] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [isTodoExpanded, setIsTodoExpanded] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [weatherError, setWeatherError] = useState<string | null>(null)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchImages()
    getLocation()
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user)
      if (user) {
        fetchTodos(user.uid)
      }
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (location) {
      fetchWeather(location.lat, location.lon)
    }
  }, [location])

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          })
        },
        (error) => {
          console.error("Error getting location:", error)
          setWeatherError("Unable to get location")
        }
      )
    } else {
      console.error("Geolocation is not supported by this browser.")
      setWeatherError("Geolocation not supported")
    }
  }

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/background-images')
      const data = await response.json()
      
      if (data.images && data.images.length > 0) {
        setImageUrls(data.images)
        changeBackground(data.images)
      }
    } catch (error) {
      console.error('Error fetching images:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }
      setWeather(data)
      setWeatherError(null)
    } catch (error) {
      console.error('Error fetching weather:', error)
      setWeatherError('Failed to fetch weather data')
      setWeather(null)
    }
  }

  const changeBackground = useCallback((images: string[] = imageUrls) => {
    if (images.length > 0) {
      let newBackground
      do {
        newBackground = images[Math.floor(Math.random() * images.length)]
      } while (newBackground === background && images.length > 1)
      setBackground(newBackground)
    }
  }, [background, imageUrls])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    window.location.href = `https://www.google.com/search?q=${searchQuery}`
  }

  const fetchTodos = async (userId: string) => {
    const q = query(collection(db, 'todos'), where('userId', '==', userId))
    const querySnapshot = await getDocs(q)
    const fetchedTodos = querySnapshot.docs.map(doc => ({ id: doc.id, text: doc.data().text }))
    setTodos(fetchedTodos)
  }

  const addTodo = async () => {
    if (newTodo.trim() && user) {
      const docRef = await addDoc(collection(db, 'todos'), {
        text: newTodo.trim(),
        userId: user.uid,
        createdAt: new Date()
      })
      setTodos([...todos, { id: docRef.id, text: newTodo.trim() }])
      setNewTodo('')
    }
  }

  const removeTodo = async (id: string) => {
    await deleteDoc(doc(db, 'todos', id))
    setTodos(todos.filter(todo => todo.id !== id))
  }

  const signIn = async () => {
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error('Error signing in:', error)
    }
  }

  const signOut = async () => {
    try {
      await auth.signOut()
      setTodos([])
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const quickLinks = [
    { name: 'Gmail', url: 'https://mail.google.com' },
    { name: 'YouTube', url: 'https://www.youtube.com' },
    { name: 'GitHub', url: 'https://github.com' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com' },
  ]

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim() === '') {
        setSuggestions([])
        return
      }

      try {
        const response = await fetch(`/api/search-suggestions?q=${encodeURIComponent(searchQuery)}`)
        const data = await response.json()
        setSuggestions(data.suggestions)
      } catch (error) {
        console.error('Error fetching suggestions:', error)
        setSuggestions([])
      }
    }

    const debounceTimer = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const handleSearchQueryChange = (value: string | null) => {
    setSearchQuery(value || '')
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {background && (
        <Image
          src={background}
          alt="Background"
          layout="fill"
          objectFit="cover"
          quality={100}
          priority
        />
      )}
      <div className="absolute inset-0 bg-black bg-opacity-30" />
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
        <Button
          variant="outline"
          size="icon"
          onClick={() => changeBackground()}
          className="absolute top-4 right-4 text-white hover:bg-white/20"
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="sr-only">Change background</span>
        </Button>

        <div className="w-full max-w-4xl mx-auto flex flex-col items-center space-y-8">
          {/* Clock */}
          <div className="text-6xl font-bold text-white drop-shadow-lg">
            {time.toLocaleTimeString()}
          </div>

          {/* Search Bar with Autosuggest */}
          <div className="w-full max-w-2xl relative z-50">
            <form onSubmit={handleSearch} className="relative">
              <Combobox value={searchQuery} onChange={handleSearchQueryChange}>
                <div className="relative">
                  <Combobox.Input
                    className="w-full pl-10 pr-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-white placeholder-white/70"
                    placeholder="Search Google or type a URL"
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70" />
                </div>
                <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white/90 backdrop-blur-md py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {suggestions.map((suggestion) => (
                    <Combobox.Option
                      key={suggestion}
                      value={suggestion}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active ? 'bg-blue-600 text-white' : 'text-gray-900'
                        }`
                      }
                    >
                      {suggestion}
                    </Combobox.Option>
                  ))}
                </Combobox.Options>
              </Combobox>
            </form>
          </div>

          {/* Quick Links (only visible when not searching) */}
          {searchQuery === '' && (
            <div className="flex flex-wrap justify-center gap-4">
              {quickLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  className="flex items-center justify-center w-24 h-24 rounded-lg bg-white/20 backdrop-blur-md hover:bg-white/30 transition-colors text-white"
                >
                  {link.name}
                </a>
              ))}
            </div>
          )}

          {/* Weather Widget */}
          <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-md rounded-lg p-4 text-white">
            {weatherError ? (
              <div className="flex items-center space-x-2 text-yellow-300">
                <AlertTriangle className="w-5 h-5" />
                <span>{weatherError}</span>
              </div>
            ) : weather ? (
              <>
                {weather.condition === 'sunny' && <Sun />}
                {weather.condition === 'cloudy' && <Cloud />}
                {weather.condition === 'rainy' && <CloudRain />}
                <span>{weather.temp}°C</span>
              </>
            ) : (
              <Loader2 className="animate-spin" />
            )}
          </div>

          {/* Todo List */}
          <div className="w-full max-w-md bg-white/20 backdrop-blur-md rounded-lg p-4 text-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Todo List</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsTodoExpanded(!isTodoExpanded)}
                className="hover:bg-white/20"
              >
                {isTodoExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
            {user ? (
              <>
                <div className="flex mb-4">
                  <Input
                    type="text"
                    placeholder="Add a new todo"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    className="flex-grow mr-2 bg-white/30 text-white placeholder-white/70"
                  />
                  <Button onClick={addTodo} className="bg-white/20 hover:bg-white/30">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className={`overflow-hidden transition-all duration-300 ${isTodoExpanded ? 'max-h-60' : 'max-h-24'}`}>
                  <ul className="space-y-2 overflow-y-auto">
                    {todos.slice(0, 5).map((todo) => (
                      <li key={todo.id} className="flex items-center justify-between">
                        <span className="truncate">{todo.text}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeTodo(todo.id)} className="hover:bg-white/20">
                          <X className="w-4 h-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button onClick={signOut} className="mt-4 w-full bg-white/20 hover:bg-white/30">Sign Out</Button>
              </>
            ) : (
              <Button onClick={signIn} className="w-full bg-white/20 hover:bg-white/30">Sign In with Google</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}