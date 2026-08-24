import React from 'react'

export const MapEmbed: React.FC = () => {
  return (
    <div className="w-full">
      <iframe
        src="https://www.google.com/maps/d/u/0/embed?mid=1yq1ias0117bGZhv_s6QMoX7kS8aqyAo&ehbc=2E312F"
        className="w-full h-96 border-0 rounded-lg"
        title="מפת נקודות סכנה"
        loading="lazy"
      />
    </div>
  )
}