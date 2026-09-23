import { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, FileText } from 'lucide-react';
import styles from './AudioPlayer.module.css';

export interface AudioPlayerProps {
  src?: string;
  transcript?: string;
  onTranscriptViewed?: () => void;
  title?: string;
}

export function AudioPlayer({
  src,
  transcript,
  onTranscriptViewed,
  title,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = Number(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const replaySegment = (seconds: number = 5) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, audio.currentTime - seconds);
  };

  const changeRate = () => {
    const rates = [0.75, 1, 1.25, 1.5];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const toggleTranscript = () => {
    const nextState = !showTranscript;
    setShowTranscript(nextState);
    if (nextState && onTranscriptViewed) {
      onTranscriptViewed();
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className={styles.container}>
      {title && <div className={styles.title}>{title}</div>}

      <audio ref={audioRef} src={src} preload="metadata" />

      <div className={styles.controlsRow}>
        <button
          type="button"
          onClick={togglePlay}
          className={styles.playButton}
          aria-label={isPlaying ? 'Tạm dừng audio' : 'Phát audio'}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>

        <button
          type="button"
          onClick={() => replaySegment(5)}
          className={styles.secondaryButton}
          title="Lùi 5 giây"
          aria-label="Lùi 5 giây"
        >
          <RotateCcw size={16} />
          <span className={styles.smallLabel}>-5s</span>
        </button>

        <div className={styles.progressContainer}>
          <span className={`${styles.time} text-tabular`}>{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className={styles.progressBar}
            aria-label="Thanh trượt thời gian audio"
          />
          <span className={`${styles.time} text-tabular`}>{formatTime(duration)}</span>
        </div>

        <button
          type="button"
          onClick={changeRate}
          className={`${styles.rateButton} text-tabular`}
          aria-label={`Tốc độ phát: ${playbackRate}x`}
        >
          {playbackRate}x
        </button>

        {transcript && (
          <button
            type="button"
            onClick={toggleTranscript}
            className={`${styles.transcriptButton} ${showTranscript ? styles.activeTranscript : ''}`}
            aria-expanded={showTranscript}
          >
            <FileText size={15} />
            <span>Lời thoại</span>
          </button>
        )}
      </div>

      {showTranscript && transcript && (
        <div className={styles.transcriptBox} role="region" aria-label="Nội dung lời thoại audio">
          <div className={styles.transcriptHeader}>
            <span className={styles.assistedNotice}>
              * Đang bật lời thoại (Ghi nhận chế độ Hỗ trợ - Assisted)
            </span>
          </div>
          <p className={styles.transcriptText}>{transcript}</p>
        </div>
      )}
    </div>
  );
}
