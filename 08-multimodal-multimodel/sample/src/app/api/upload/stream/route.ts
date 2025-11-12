import { NextRequest, NextResponse } from 'next/server';
import { DecisionEngine } from '@/lib/decision-engine';
import { validateConfig } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Validate configuration first
  const configCheck = validateConfig();
  if (!configCheck.valid) {
    console.error('[API] Configuration invalid:', configCheck.errors);
    return NextResponse.json(
      { 
        error: 'Server configuration error', 
        details: configCheck.errors.join('\n')
      },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const text = (formData.get('text') as string) || '';
    const question = (formData.get('question') as string) || '';

    console.log(
      `[DEBUG] Received files: ${files.length}, text: ${!!text}, question: ${!!question}`
    );

    const decisionEngine = new DecisionEngine();

    // Create a readable stream
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Helper to send SSE data
          const sendEvent = (event: any) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          };

          // Prepare all inputs
          const inputs: any[] = [];

          // Process uploaded files
          if (files && files.length > 0) {
            for (const file of files) {
              console.log(
                `[DEBUG] Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`
              );
              sendEvent({
                type: 'file_uploaded',
                filename: file.name,
                size: file.size
              });
              await sleep(200);

              const contentType = file.type || '';
              if (contentType.startsWith('image')) {
                const buffer = await file.arrayBuffer();
                const base64Image = Buffer.from(buffer).toString('base64');
                inputs.push({
                  type: 'image',
                  data: `data:${contentType};base64,${base64Image}`,
                  filename: file.name
                });
              } else if (contentType.startsWith('audio')) {
                inputs.push({
                  type: 'audio',
                  data: `Audio file: ${file.name} (${file.size} bytes)`,
                  filename: file.name
                });
              } else {
                // Text file
                const textContent = await file.text();
                inputs.push({
                  type: 'text',
                  data: textContent,
                  filename: file.name
                });
              }
            }
          }

          // Add direct text input if provided
          if (text.trim()) {
            inputs.push({
              type: 'text',
              data: text,
              filename: 'direct_input'
            });
          }

          // Determine primary input type and combine data
          if (inputs.length === 0) {
            throw new Error('No input provided');
          }

          console.log(
            `[DEBUG] Total inputs: ${inputs.length}, types: ${inputs.map(inp => inp.type).join(', ')}`
          );

          const inputTypes = new Set(inputs.map(inp => inp.type));

          let primaryType: string;
          let combinedData: string;

          if (inputTypes.size > 1) {
            // Multiple input types - multimodal scenario
            primaryType = inputTypes.has('image') ? 'image' : inputs[0].type;
            // For images in multimodal, keep base64 clean without wrapping
            if (primaryType === 'image') {
              const imageInput = inputs.find(inp => inp.type === 'image');
              const textInputs = inputs.filter(inp => inp.type !== 'image');
              combinedData = imageInput?.data || '';
              // Store question/text separately - will be added in decision engine
            } else {
              combinedData = inputs.map(inp => `[${inp.type.toUpperCase()}]: ${inp.data}`).join('\n');
            }
          } else {
            // Single input type
            primaryType = inputs[0].type;
            if (primaryType === 'image') {
              combinedData = inputs[0].data; // Use base64 directly for images
            } else {
              combinedData = inputs.map(inp => inp.data).join('\n');
            }
          }

          console.log(
            `[DEBUG] Starting analysis - primary_type: ${primaryType}, data length: ${combinedData.length}`
          );

          // Stream analysis
          for await (const event of decisionEngine.analyzeStreaming(
            primaryType,
            combinedData,
            undefined,
            question || undefined
          )) {
            console.log(`[DEBUG] Yielding event: ${event.type}`);
            sendEvent(event);
            await sleep(100);
          }

          controller.close();
        } catch (error: any) {
          console.error('[ERROR]', error);
          const errorEvent = {
            type: 'error',
            error: error.message,
            details: error.constructor.name
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('[ERROR]', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
