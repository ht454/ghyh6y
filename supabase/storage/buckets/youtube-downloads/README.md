# YouTube Downloads Bucket

This bucket is used to store downloaded YouTube videos and audio files.

## Policies

- Service role can upload files
- Authenticated users can download files
- Service role can delete files

## File Structure

Files are stored in the following format:
- `{title}-{videoId}-{timestamp}.{format}`

Where:
- `title` is a sanitized version of the video title
- `videoId` is the YouTube video ID
- `timestamp` is the Unix timestamp when the file was created
- `format` is either `mp3` or `mp4`

## Retention Policy

Files in this bucket are automatically deleted after 24 hours to comply with copyright regulations and save storage space.