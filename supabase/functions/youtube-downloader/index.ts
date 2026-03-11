

import { serve } from "npm:@supabase/functions-js@2.1.0";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

interface DownloadRequest {
  youtubeUrl: string;
  startTime?: string;
  endTime?: string;
  format: "mp3" | "mp4";
}

serve(async (req) => {
  
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    
    const requestData: DownloadRequest = await req.json();
    const { youtubeUrl, startTime, endTime, format } = requestData;

    
    if (!youtubeUrl) {
      return new Response(
        JSON.stringify({ error: "YouTube URL is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    if (!youtubeRegex.test(youtubeUrl)) {
      return new Response(
        JSON.stringify({ error: "Invalid YouTube URL" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      return new Response(
        JSON.stringify({ error: "Could not extract video ID from URL" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

   
    const videoInfo = await getVideoInfo(videoId);

    
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    
    const downloadResult = await processYouTubeDownload(
      supabase,
      videoId,
      format,
      videoInfo.title,
      startTime,
      endTime
    );

    return new Response(
      JSON.stringify({
        success: true,
        videoInfo,
        downloadUrl: downloadResult.downloadUrl,
        format,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});


function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^/?]+)/i,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^/?]+)/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^/?]+)/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/user\/[^/]+\/\?v=([^&]+)/i
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}


async function getVideoInfo(videoId: string) {
  try {
   
    return {
      title: `YouTube Video ${videoId}`,
      thumbnail: `https://img.youtube.com/vi/${videoId}/0.jpg`,
      duration: "10:30",
      videoId: videoId
    };
  } catch (error) {
    console.error("Error getting video info:", error);
    throw new Error("Failed to get video information");
  }
}


async function processYouTubeDownload(
  supabase: any,
  videoId: string,
  format: string,
  title: string,
  startTime?: string,
  endTime?: string
) {
  try {
    
    console.log(`Processing YouTube download for video ${videoId} in ${format} format`);
    
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
   
    const timestamp = Date.now();
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${sanitizedTitle}-${videoId}-${timestamp}.${format}`;
    const filePath = `youtube-downloads/${fileName}`;
    
    
    console.log(`Would upload file to ${filePath}`);
    
    
    const downloadUrl = `https://example.com/downloads/${fileName}`;
    
    return {
      success: true,
      downloadUrl,
      fileName,
      format
    };
  } catch (error) {
    console.error("Error processing YouTube download:", error);
    throw new Error("Failed to process YouTube download");
  }
}