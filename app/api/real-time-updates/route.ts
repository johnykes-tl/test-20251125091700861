import { NextRequest, NextResponse } from 'next/server';

// Server-Sent Events for real-time updates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const userRole = searchParams.get('user_role');

    console.log('🔄 SSE Connection established', { userId, userRole });

    // Create readable stream for Server-Sent Events
    const stream = new ReadableStream({
      start(controller) {
        // Send proper SSE format with retry field
        const sendSSEMessage = (data: any) => {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          try {
            controller.enqueue(new TextEncoder().encode(message));
          } catch (_error) {
            console.log('🔌 SSE Client disconnected during message send');
          }
        };

        // Send initial connection message
        sendSSEMessage({
          type: 'connection',
          message: 'Real-time updates connected',
          timestamp: new Date().toISOString(),
          userRole
        });
        // Set up periodic heartbeat every 30 seconds
        const heartbeatInterval = setInterval(() => {
           sendSSEMessage({
           type: 'heartbeat',
            timestamp: new Date().toISOString()
           });
       }, 30000);

        // Listen for database changes (this would integrate with Supabase realtime)
        const sendUpdate = (updateType: string, data: any) => {
           sendSSEMessage({
           type: updateType,
            data,
            timestamp: new Date().toISOString()
           });
       };

        // Store cleanup function for connection close
        request.signal.addEventListener('abort', () => {
          console.log('🔌 SSE Connection closed by client');
          clearInterval(heartbeatInterval);
           try {
            controller.close();
          } catch (_error) {
            console.log('🔌 Controller already closed');
          }
       });

        // Example: Send updates every 60 seconds (replace with actual database subscriptions)
        const updateInterval = setInterval(() => {
           try {
            sendUpdate('dashboard_stats', {
              timestamp: new Date().toISOString(),
              stats: {
                // These would be real stats from database
                totalEmployees: Math.floor(Math.random() * 100),
                activeEmployees: Math.floor(Math.random() * 80),
              }
            });
          } catch (_error) {
            console.log('🔌 Error sending update, clearing interval');
            clearInterval(updateInterval);
          }
        }, 60000);

        // Enhanced cleanup on connection close
        const cleanup = () => {
          console.log('🧹 Cleaning up SSE resources');
          clearInterval(heartbeatInterval);
          clearInterval(updateInterval);
          try {
            if (controller.desiredSize !== null) {
              controller.close();
            }
          } catch (_error) {
            console.log('🔌 Controller cleanup completed');
          }
        };

        request.signal.addEventListener('abort', cleanup);

        // Backup cleanup for browser close
        setTimeout(() => {
          if (request.signal.aborted) {
            cleanup();
          }
        }, 300000); // 5 minutes max connection time
      },
      
      cancel() {
        console.log('🔌 SSE Stream cancelled');
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
        'X-Accel-Buffering': 'no',
        'Transfer-Encoding': 'chunked'
      },
    });

  } catch (error) {
    console.error('❌ SSE Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to establish real-time connection' },
      { status: 500 }
    );
  }
}