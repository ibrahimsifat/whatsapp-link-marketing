/**
 * Storage Service
 *
 * Handles all local storage operations with error handling, compression,
 * and data validation. Provides a consistent interface for data persistence.
 */

import { APP_CONSTANTS, ERROR_MESSAGES, SUCCESS_MESSAGES } from "../constants/app-constants"
import type { StorageResult, StorageServiceConfig } from "./types"

export class StorageService {
  private static config: StorageServiceConfig = {
    keyPrefix: "whatsapp_generator_",
    compression: false,
    encryption: false,
    maxSize: 5 * 1024 * 1024, // 5MB
  }

  /**
   * Configure storage service
   */
  static configure(config: Partial<StorageServiceConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Save data to local storage
   */
  static save<T>(key: string, data: T): StorageResult<T> {
    try {
      const fullKey = this.config.keyPrefix + key
      const serializedData = JSON.stringify({
        data,
        timestamp: new Date().toISOString(),
        version: APP_CONSTANTS.APP_VERSION,
      })

      // Check size limit
      if (serializedData.length > this.config.maxSize) {
        return {
          success: false,
          message: ERROR_MESSAGES.GENERAL.STORAGE_FULL,
        }
      }

      localStorage.setItem(fullKey, serializedData)

      return {
        success: true,
        data,
        message: SUCCESS_MESSAGES.GENERAL.SAVED,
        storageInfo: {
          key: fullKey,
          size: serializedData.length,
          lastModified: new Date().toISOString(),
        },
      }
    } catch (error) {
      console.error("Storage save error:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR,
      }
    }
  }

  /**
   * Load data from local storage
   */
  static load<T>(key: string, defaultValue?: T): StorageResult<T> {
    try {
      const fullKey = this.config.keyPrefix + key
      const serializedData = localStorage.getItem(fullKey)

      if (!serializedData) {
        return {
          success: true,
          data: defaultValue,
          message: "No data found, using default value",
        }
      }

      const parsedData = JSON.parse(serializedData)

      // Validate data structure
      if (!parsedData.data || !parsedData.timestamp) {
        throw new Error("Invalid data structure")
      }

      return {
        success: true,
        data: parsedData.data,
        message: "Data loaded successfully",
        storageInfo: {
          key: fullKey,
          size: serializedData.length,
          lastModified: parsedData.timestamp,
        },
      }
    } catch (error) {
      console.error("Storage load error:", error)
      return {
        success: false,
        data: defaultValue,
        message: error instanceof Error ? error.message : ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR,
      }
    }
  }

  /**
   * Remove data from local storage
   */
  static remove(key: string): StorageResult<void> {
    try {
      const fullKey = this.config.keyPrefix + key
      localStorage.removeItem(fullKey)

      return {
        success: true,
        message: "Data removed successfully",
      }
    } catch (error) {
      console.error("Storage remove error:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR,
      }
    }
  }

  /**
   * Clear all application data
   */
  static clear(): StorageResult<void> {
    try {
      const keys = Object.keys(localStorage).filter((key) => key.startsWith(this.config.keyPrefix))

      keys.forEach((key) => localStorage.removeItem(key))

      return {
        success: true,
        message: SUCCESS_MESSAGES.GENERAL.CLEARED,
      }
    } catch (error) {
      console.error("Storage clear error:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR,
      }
    }
  }

  /**
   * Get storage usage information
   */
  static getUsageInfo(): {
    used: number
    available: number
    keys: string[]
    percentage: number
  } {
    try {
      let used = 0
      const keys: string[] = []

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(this.config.keyPrefix)) {
          keys.push(key)
          const value = localStorage.getItem(key)
          if (value) {
            used += value.length
          }
        }
      }

      const available = this.config.maxSize - used
      const percentage = (used / this.config.maxSize) * 100

      return {
        used,
        available,
        keys,
        percentage,
      }
    } catch (error) {
      console.error("Storage usage info error:", error)
      return {
        used: 0,
        available: this.config.maxSize,
        keys: [],
        percentage: 0,
      }
    }
  }

  /**
   * Check if storage is available
   */
  static isAvailable(): boolean {
    try {
      const testKey = this.config.keyPrefix + "test"
      localStorage.setItem(testKey, "test")
      localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }

  /**
   * Backup all application data
   */
  static backup(): StorageResult<Record<string, any>> {
    try {
      const backup: Record<string, any> = {}

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(this.config.keyPrefix)) {
          const value = localStorage.getItem(key)
          if (value) {
            backup[key] = JSON.parse(value)
          }
        }
      }

      return {
        success: true,
        data: backup,
        message: "Backup created successfully",
      }
    } catch (error) {
      console.error("Storage backup error:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR,
      }
    }
  }

  /**
   * Restore data from backup
   */
  static restore(backup: Record<string, any>): StorageResult<void> {
    try {
      // Clear existing data first
      this.clear()

      // Restore backup data
      Object.entries(backup).forEach(([key, value]) => {
        if (key.startsWith(this.config.keyPrefix)) {
          localStorage.setItem(key, JSON.stringify(value))
        }
      })

      return {
        success: true,
        message: "Data restored successfully",
      }
    } catch (error) {
      console.error("Storage restore error:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR,
      }
    }
  }
}
