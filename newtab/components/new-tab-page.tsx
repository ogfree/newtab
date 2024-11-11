'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, X, Sun, Cloud, CloudRain, RefreshCw } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Image from 'next/image'

export function NewTabPageComponent() {
  const [time, setTime] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState('')
  const [todos, setTodos] = useState<string[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [weather, setWeather] = useState({ temp: 0, condition: 'sunny' })
  const [background, setBackground] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/background-images')
      const data = await response.json()
      
      if (data.images && data.images.length > 0) {
        setImageUrls(data.images)
        setBackground(data.images[Math.floor(Math.random() * data.images.length)])
      }
    } catch (error) {
      console.error('Error fetching images:', error)
      setBackground('/placeholder.svg?height=1080&width=1920')
    } finally {
      setIsLoading(false)
    }
  }

  const changeBackground = () => {
    if (imageUrls.length > 0) {
      let newBackground
      do {
        newBackground = imageUrls[Math.floor(Math.random() * imageUrls.length)]
      } while (newBackground === background && imageUrls.length > 1)
      setBackground(newBackground)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    window.location.href = `https://www.google.com/search?q=${searchQuery}`
  }

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([...todos, newTodo.trim()])
      setNewTodo('')
    }
  }

  const removeTodo = (index: number) => {
    setTodos(todos.filter((_, i) => i !== index))
  }

  const quickLinks = [
    { name: 'Gmail', url: 'https://mail.google.com' },
    { name: 'YouTube', url: 'https://www.youtube.com' },
    { name: 'GitHub', url: 'https://github.com' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com' },
  ]

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
          onClick={changeBackground}
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

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="w-full max-w-2xl">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search Google or type a URL"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-white placeholder-white/70"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70" />
            </div>
          </form>

          {/* Quick Links */}
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

          {/* Weather Widget */}
          <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-md rounded-lg p-4 text-white">
            {weather.condition === 'sunny' && <Sun />}
            {weather.condition === 'cloudy' && <Cloud />}
            {weather.condition === 'rainy' && <CloudRain />}
            <span>{weather.temp}°C</span>
          </div>

          {/* Todo List */}
          <div className="w-full max-w-md bg-white/20 backdrop-blur-md rounded-lg p-4 text-white">
            <h2 className="text-xl font-bold mb-4">Todo List</h2>
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
            <ul>
              {todos.map((todo, index) => (
                <li key={index} className="flex items-center justify-between mb-2">
                  <span>{todo}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeTodo(index)} className="hover:bg-white/20">
                    <X className="w-4 h-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}