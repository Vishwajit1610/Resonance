import { create } from 'zustand';

const usePlayerStore = create((set) => ({
  // 1. The State (The Truth)
  currentTrack: null,   // Holds the track objects such as id, title, file_path, artists
  isPlaying: false,     // The play/pause boolean
  queue: [],            // The upcoming tracks (will use Doubly LinkedList later)

  // Timeline State
  currentTime: 0,
  duration: 0,
  seekCommand: null,

  // 2. The Actions (The Mutators)
  // set() is Zustand's internal method to merge new state into the old state.
  playTrack: (track) => set({
    currentTrack: track,
    isPlaying: true
  }),

  playNext: () => set((state) => {
    // If we are not playing a song, or if we are at the Tail (no next song).
    // we do nothing, and return an empty object to tell Zustand NOT to update.
    if (!state.currentTrack || state.currentTrack.next === null) {
      return {};
    }

    // We know the next track exists, We command Zustand to overwrite the currentTrack memory address with the next track's memory address.
    return {
      currentTrack: state.currentTrack.next,
      isPlaying: true,
    }
  }),

  playPrev: () => set((state) => {
    // If we are not playing a song, or if we are at the Head (no prev song).
    // we do nothing, and return an empty object to tell Zustand NOT to update.
    if (!state.currentTrack || state.currentTrack.prev === null) {
      return {};
    }
    
    // We know the prev track exists, We command Zustand to overwrite the currentTrack memory address with the prev track's memory address.
    return {
      currentTrack: state.currentTrack.prev,
      isPlaying: true,
    }
  }),

  togglePlay: () => set((state) => ({
    // Flips the boolean based on the previous state
    isPlaying: !state.isPlaying
  })),

  // A dedicated mutator for hardware sync.
  setIsPlaying: (status) => set({ isPlaying: status }),

  // Timeline Mutators
  updateProgress: (currentTime, duration) => set({ currentTime, duration }),
  seekTo: (time) => set({ seekCommand: time }),
  clearSeekCommand: () => set({ seekCommand: null }),

  setQueue: (newQueue) => set({
    queue: newQueue
  }),
}));

export default usePlayerStore;
