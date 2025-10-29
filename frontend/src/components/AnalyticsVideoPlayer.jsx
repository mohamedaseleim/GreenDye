import React, { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';
import { trackVideoProgress } from '../services/analyticsService';

const AnalyticsVideoPlayer = ({ url, courseId, lessonId }) => {
  const videoRef = useRef(null);
  const [milestones, setMilestones] = useState({
    25: false,
    50: false,
    75: false,
    100: false,
  });

  useEffect(() => {
    const video = videoRef.current;
    let hls;

    const handleTimeUpdate = () => {
      if (!video || !video.duration) return;
      const currentTime = video.currentTime;
      const duration = video.duration;
      const percent = (currentTime / duration) * 100;

      const updatedMilestones = { ...milestones };

      const checkAndSend = (threshold) => {
        if (!updatedMilestones[threshold] && percent >= threshold) {
          // track progress event
          trackVideoProgress(courseId, lessonId, threshold);
          updatedMilestones[threshold] = true;
        }
      };

      [25, 50, 75, 100].forEach(checkAndSend);

      setMilestones(updatedMilestones);
    };

    if (video) {
      if (video.canPlayType('application/vnd.apple.mpegURL')) {
        video.src = url;
      } else if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
      }

      video.addEventListener('timeupdate', handleTimeUpdate);
      video.play();
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
      if (video) {
        video.removeEventListener('timeupdate', handleTimeUpdate);
      }
    };
  }, [url, courseId, lessonId, milestones]);

  return (
    <video
      ref={videoRef}
      controls
      style={{ width: '100%', height: 'auto' }}
    />
  );
};

export default AnalyticsVideoPlayer;
