import React from 'react'

export default function 
() {
  return (
    <div>
        <aside className="w-64 bg-gray-200 p-4 hidden md:block">
        <div className="text-lg font-semibold">Sidebar</div>
        <ul className="mt-4 space-y-4">
          <li><a href="#" className="hover:text-gray-600">Settings</a></li>
          <li><a href="#" className="hover:text-gray-600">Features</a></li>
        </ul>
      </aside>
    </div>
  )
}
