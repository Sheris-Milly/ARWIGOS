"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, RefreshCw, AlertCircle } from 'lucide-react'

export interface SaveNotificationProps {
  show: boolean
  status: 'saving' | 'saved' | 'error'
  message: string
}

export function SaveNotification({ show, status, message }: SaveNotificationProps) {
  if (!show) return null
  
  const bgColor = {
    saving: 'bg-blue-100 dark:bg-blue-900',
    saved: 'bg-green-100 dark:bg-green-900',
    error: 'bg-red-100 dark:bg-red-900'
  }[status]
  
  const textColor = {
    saving: 'text-blue-800 dark:text-blue-200',
    saved: 'text-green-800 dark:text-green-200',
    error: 'text-red-800 dark:text-red-200'
  }[status]
  
  const icon = {
    saving: <RefreshCw className="h-4 w-4 animate-spin" />,
    saved: <Check className="h-4 w-4" />,
    error: <AlertCircle className="h-4 w-4" />
  }[status]
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
          className={`fixed bottom-24 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-md shadow-md ${bgColor}`}
        >
          <span className={textColor}>{icon}</span>
          <span className={`text-sm font-medium ${textColor}`}>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
