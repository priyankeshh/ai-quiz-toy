import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Download } from 'lucide-react';
import { logger, BrowserCompatibility } from '../utils/logger';
import VoiceManager from './VoiceManager';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

const TestSuite: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [voiceManager] = useState(() => new VoiceManager());

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    logger.info('TEST', 'Starting comprehensive test suite');

    const results: TestResult[] = [];

    // Test 1: Browser Compatibility
    try {
      const compatibility = BrowserCompatibility.runAllChecks();
      const failedChecks = Object.entries(compatibility).filter(([_, supported]) => !supported);
      
      if (failedChecks.length === 0) {
        results.push({
          name: 'Browser Compatibility',
          status: 'pass',
          message: 'All browser features supported',
          details: compatibility
        });
      } else {
        results.push({
          name: 'Browser Compatibility',
          status: 'warning',
          message: `Some features not supported: ${failedChecks.map(([name]) => name).join(', ')}`,
          details: compatibility
        });
      }
    } catch (error) {
      results.push({
        name: 'Browser Compatibility',
        status: 'fail',
        message: 'Failed to check browser compatibility',
        details: error
      });
    }

    // Test 2: Voice Manager
    try {
      voiceManager.speak('Test speech', { rate: 1.0, pitch: 1.0 });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for speech to start
      
      results.push({
        name: 'Voice Manager',
        status: 'pass',
        message: 'Voice synthesis working'
      });
    } catch (error) {
      results.push({
        name: 'Voice Manager',
        status: 'fail',
        message: 'Voice synthesis failed',
        details: error
      });
    }

    // Test 3: API Connectivity
    try {
      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          age: 8,
          interests: ['Testing']
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          results.push({
            name: 'API Connectivity',
            status: 'pass',
            message: 'Backend API responding correctly',
            details: { profileId: data.profile.id }
          });
        } else {
          results.push({
            name: 'API Connectivity',
            status: 'fail',
            message: 'API returned error',
            details: data
          });
        }
      } else {
        results.push({
          name: 'API Connectivity',
          status: 'fail',
          message: `API returned status ${response.status}`,
          details: { status: response.status }
        });
      }
    } catch (error) {
      results.push({
        name: 'API Connectivity',
        status: 'fail',
        message: 'Failed to connect to backend',
        details: error
      });
    }

    // Test 4: Local Storage
    try {
      const testKey = 'test_storage_key';
      const testValue = { test: 'data', timestamp: Date.now() };
      
      localStorage.setItem(testKey, JSON.stringify(testValue));
      const retrieved = JSON.parse(localStorage.getItem(testKey) || '{}');
      localStorage.removeItem(testKey);
      
      if (retrieved.test === testValue.test) {
        results.push({
          name: 'Local Storage',
          status: 'pass',
          message: 'Local storage working correctly'
        });
      } else {
        results.push({
          name: 'Local Storage',
          status: 'fail',
          message: 'Local storage data corruption'
        });
      }
    } catch (error) {
      results.push({
        name: 'Local Storage',
        status: 'fail',
        message: 'Local storage not available',
        details: error
      });
    }

    // Test 5: Performance Check
    try {
      const startTime = performance.now();
      
      // Simulate some work
      for (let i = 0; i < 100000; i++) {
        Math.random();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration < 100) {
        results.push({
          name: 'Performance',
          status: 'pass',
          message: `Good performance: ${duration.toFixed(2)}ms`,
          details: { duration }
        });
      } else {
        results.push({
          name: 'Performance',
          status: 'warning',
          message: `Slow performance: ${duration.toFixed(2)}ms`,
          details: { duration }
        });
      }
    } catch (error) {
      results.push({
        name: 'Performance',
        status: 'fail',
        message: 'Performance test failed',
        details: error
      });
    }

    setTestResults(results);
    setIsRunning(false);
    
    const passCount = results.filter(r => r.status === 'pass').length;
    const totalCount = results.length;
    
    logger.info('TEST', `Test suite completed: ${passCount}/${totalCount} tests passed`);
  };

  const exportLogs = () => {
    const logs = logger.exportLogs();
    const blob = new Blob([logs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-app-logs-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'fail': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'border-green-200 bg-green-50';
      case 'fail': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="kid-card-rainbow p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          🧪 App Quality Test Suite
        </h2>
        
        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={runTests}
            disabled={isRunning}
            className="kid-button-primary disabled:opacity-50"
          >
            {isRunning ? '🔄 Running Tests...' : '🚀 Run All Tests'}
          </button>
          
          <button
            onClick={exportLogs}
            className="kid-button-secondary"
          >
            <Download className="w-5 h-5 inline mr-2" />
            📋 Export Logs
          </button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-700 mb-4">Test Results:</h3>
            
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border-2 ${getStatusColor(result.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(result.status)}
                    <span className="font-semibold text-gray-800">{result.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">{result.message}</span>
                </div>
                
                {result.details && (
                  <details className="mt-2">
                    <summary className="text-sm text-gray-600 cursor-pointer">
                      View Details
                    </summary>
                    <pre className="text-xs text-gray-500 mt-2 overflow-auto bg-white p-2 rounded">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
            
            <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
              <h4 className="font-bold text-blue-800 mb-2">Summary:</h4>
              <p className="text-blue-700">
                ✅ {testResults.filter(r => r.status === 'pass').length} Passed | 
                ⚠️ {testResults.filter(r => r.status === 'warning').length} Warnings | 
                ❌ {testResults.filter(r => r.status === 'fail').length} Failed
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestSuite;
