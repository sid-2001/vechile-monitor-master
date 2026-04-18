// dataWorker.ts
self.onmessage = (e) => {
  const { type, data, currentPoints } = e.data
  
  if (type === 'processPoints') {
    // Process points in background thread
    const processedPoints = data.map((point: any) => ({
      _id: point._id,
      latitude: point.latitude,
      longitude: point.longitude,
      speed: point.speed,
      time: point.time
    }))
    
    self.postMessage({
      type: 'processedPoints',
      data: processedPoints
    })
  }
}