import React from 'react'
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "../components/app-sidebar"
import Navbar from '@/components/navbar'
import MyPolls from '@/components/MyPolls'

const MyPollsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <AppSidebar />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <MyPolls />
            </div>
          </div>

          {/* Right Sidebar - Empty for now or can add future features */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              {/* Future widgets can go here */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MyPollsPage
