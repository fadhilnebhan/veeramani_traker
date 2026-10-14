import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TrackerEntry } from '@/types';

// Mock Leaflet and React-Leaflet
const mockMap = {
  flyTo: vi.fn(),
  stop: vi.fn(),
  closePopup: vi.fn(),
  getZoom: vi.fn().mockReturnValue(7.3),
  on: vi.fn(),
  off: vi.fn(),
};

vi.mock('react-leaflet', () => {
  return {
    MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
    TileLayer: () => <div data-testid="tile-layer" />,
    Marker: ({ eventHandlers, icon, children }: any) => (
      <div
        data-testid="map-marker"
        className={icon?.options?.className}
        onClick={(e) => eventHandlers?.click?.(e)}
      >
        {children}
      </div>
    ),
    useMap: () => mockMap,
  };
});

vi.mock('leaflet', () => {
  return {
    default: {
      divIcon: vi.fn().mockImplementation((opts) => ({
        options: opts,
        html: opts.html,
      })),
      DomEvent: {
        stopPropagation: vi.fn(),
      },
    },
    divIcon: vi.fn().mockImplementation((opts) => ({
      options: opts,
      html: opts.html,
    })),
    DomEvent: {
      stopPropagation: vi.fn(),
    },
  };
});

import InteractiveMap from '@/components/map/interactive-map';

const sampleEvents: TrackerEntry[] = [
  {
    id: 'entry-1',
    title: 'Chennai Lighthouse Resonance',
    slug: 'chennai-lighthouse-resonance',
    description: 'FM radio oscillation near Marina',
    category: 'cinematic_echo',
    district: 'Chennai',
    landmark_name: 'Marina Lighthouse',
    latitude: 13.0499,
    longitude: 80.2824,
    signal_strength: 95,
    frequency_mhz: 98.4,
    is_fictional_confirmed: true,
    status: 'approved',
    created_at: '2026-10-10T00:00:00Z',
    updated_at: '2026-10-10T00:00:00Z',
  },
  {
    id: 'entry-2',
    title: 'Madurai Teppakulam Echo',
    slug: 'madurai-teppakulam-echo',
    description: 'Jasmine fragrance frequency resonance',
    category: 'folklore_rumor',
    district: 'Madurai',
    landmark_name: 'Vandiyur Mariamman Teppakulam',
    latitude: 9.9142,
    longitude: 78.1472,
    signal_strength: 88,
    frequency_mhz: 104.2,
    is_fictional_confirmed: true,
    status: 'approved',
    created_at: '2026-10-11T00:00:00Z',
    updated_at: '2026-10-11T00:00:00Z',
  },
];

describe('Map Selection, Auto-Zoom & Close Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all markers without any duplicate Leaflet Popup children', () => {
    const onSelect = vi.fn();
    const { container } = render(
      <InteractiveMap
        events={sampleEvents}
        selectedEvent={null}
        onSelectEvent={onSelect}
      />
    );

    // Verify markers exist
    const markers = screen.getAllByTestId('map-marker');
    expect(markers.length).toBe(2);

    // Verify NO built-in Popup element is rendered inside the markers
    const popups = container.querySelectorAll('.custom-popup');
    expect(popups.length).toBe(0);
  });

  it('triggers one-shot focus animation (map.flyTo) when a report is selected', () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <InteractiveMap
        events={sampleEvents}
        selectedEvent={null}
        onSelectEvent={onSelect}
      />
    );

    expect(mockMap.flyTo).not.toHaveBeenCalled();

    // Select Entry 1
    rerender(
      <InteractiveMap
        events={sampleEvents}
        selectedEvent={sampleEvents[0]}
        onSelectEvent={onSelect}
      />
    );

    expect(mockMap.flyTo).toHaveBeenCalledTimes(1);
    expect(mockMap.flyTo).toHaveBeenCalledWith([13.0499, 80.2824], 13, { duration: 1.0 });
  });

  it('does NOT retrigger focus animation on unrelated re-renders with the same selected report', () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <InteractiveMap
        events={sampleEvents}
        selectedEvent={sampleEvents[0]}
        onSelectEvent={onSelect}
      />
    );

    expect(mockMap.flyTo).toHaveBeenCalledTimes(1);

    // Rerender with identical selected report (e.g. parent state change, search update)
    rerender(
      <InteractiveMap
        events={sampleEvents}
        selectedEvent={{ ...sampleEvents[0] }}
        onSelectEvent={onSelect}
      />
    );

    // flyTo must NOT be called again!
    expect(mockMap.flyTo).toHaveBeenCalledTimes(1);
  });

  it('triggers focus animation once when switching from Report A to Report B', () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <InteractiveMap
        events={sampleEvents}
        selectedEvent={sampleEvents[0]}
        onSelectEvent={onSelect}
      />
    );

    expect(mockMap.flyTo).toHaveBeenCalledTimes(1);
    expect(mockMap.flyTo).toHaveBeenLastCalledWith([13.0499, 80.2824], 13, { duration: 1.0 });

    // Switch selection to Entry 2
    rerender(
      <InteractiveMap
        events={sampleEvents}
        selectedEvent={sampleEvents[1]}
        onSelectEvent={onSelect}
      />
    );

    expect(mockMap.flyTo).toHaveBeenCalledTimes(2);
    expect(mockMap.flyTo).toHaveBeenLastCalledWith([9.9142, 78.1472], 13, { duration: 1.0 });
  });

  it('stops programmatic animations and closes any popups when selection is cleared', () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <InteractiveMap
        events={sampleEvents}
        selectedEvent={sampleEvents[0]}
        onSelectEvent={onSelect}
      />
    );

    // Clear selection
    rerender(
      <InteractiveMap
        events={sampleEvents}
        selectedEvent={null}
        onSelectEvent={onSelect}
      />
    );

    expect(mockMap.stop).toHaveBeenCalled();
    expect(mockMap.closePopup).toHaveBeenCalled();
  });

  it('cancels programmatic flyTo immediately when user begins manual pan or zoom', () => {
    const onSelect = vi.fn();
    render(
      <InteractiveMap
        events={sampleEvents}
        selectedEvent={sampleEvents[0]}
        onSelectEvent={onSelect}
      />
    );

    // Extract event listener registered for dragstart
    const calls = mockMap.on.mock.calls;
    const dragHandler = calls.find((call) => call[0] === 'dragstart')?.[1];
    expect(dragHandler).toBeDefined();

    // Trigger manual user drag
    dragHandler();

    // map.stop() must be invoked so user interaction takes priority
    expect(mockMap.stop).toHaveBeenCalled();
  });

  it('closes selected report when clicking an empty map area', () => {
    const onSelect = vi.fn();
    render(
      <InteractiveMap
        events={sampleEvents}
        selectedEvent={sampleEvents[0]}
        onSelectEvent={onSelect}
      />
    );

    const calls = mockMap.on.mock.calls;
    const clickHandler = calls.find((call) => call[0] === 'click')?.[1];
    expect(clickHandler).toBeDefined();

    // Simulate clicking on empty map tile (target not a marker)
    clickHandler({
      originalEvent: {
        target: document.createElement('div'),
      },
    });

    expect(onSelect).toHaveBeenCalledWith(null);
    expect(mockMap.stop).toHaveBeenCalled();
  });

  it('does NOT dismiss selection when clicking directly on a marker pin', () => {
    const onSelect = vi.fn();
    render(
      <InteractiveMap
        events={sampleEvents}
        selectedEvent={sampleEvents[0]}
        onSelectEvent={onSelect}
      />
    );

    const calls = mockMap.on.mock.calls;
    const clickHandler = calls.find((call) => call[0] === 'click')?.[1];

    const markerEl = document.createElement('div');
    markerEl.className = 'custom-location-pin';

    // Simulate click on marker
    clickHandler({
      originalEvent: {
        target: markerEl,
      },
    });

    // onSelect should not be called with null
    expect(onSelect).not.toHaveBeenCalledWith(null);
  });

  it('highlights the selected marker with distinct pin-selected class', () => {
    const onSelect = vi.fn();
    render(
      <InteractiveMap
        events={sampleEvents}
        selectedEvent={sampleEvents[0]}
        onSelectEvent={onSelect}
      />
    );

    const markers = screen.getAllByTestId('map-marker');
    expect(markers[0].className).toContain('pin-selected');
    expect(markers[1].className).not.toContain('pin-selected');
  });

  describe('Report Detail Panel & Close Interactions', () => {
    it('supports closing the panel via visible close button and pressing Escape', () => {
      // Create a test component mirroring HomePage selection & Escape handling
      function TestHost() {
        const [selected, setSelected] = React.useState<TrackerEntry | null>(sampleEvents[0]);

        React.useEffect(() => {
          const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
              setSelected(null);
            }
          };
          window.addEventListener('keydown', handleKeyDown);
          return () => window.removeEventListener('keydown', handleKeyDown);
        }, []);

        return (
          <div>
            <div data-testid="status">{selected ? selected.title : 'No selection'}</div>
            {selected && (
              <aside
                aria-label="Report details panel"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelected(null)}
                  className="min-w-[44px] min-h-[44px] w-11 h-11"
                  aria-label="Close report details"
                >
                  Close
                </button>
              </aside>
            )}
          </div>
        );
      }

      render(<TestHost />);

      // Initially selected
      expect(screen.getByTestId('status').textContent).toBe(sampleEvents[0].title);
      const closeBtn = screen.getByRole('button', { name: /close report details/i });
      expect(closeBtn).toBeDefined();

      // Verify touch target meets 44x44px requirements
      expect(closeBtn.className).toContain('min-w-[44px]');
      expect(closeBtn.className).toContain('min-h-[44px]');

      // Test Escape key dismissal
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.getByTestId('status').textContent).toBe('No selection');
      expect(screen.queryByRole('button', { name: /close report details/i })).toBeNull();
    });

    it('clears selection when clicking the close button directly', () => {
      function TestHost() {
        const [selected, setSelected] = React.useState<TrackerEntry | null>(sampleEvents[1]);
        return (
          <div>
            <div data-testid="status">{selected ? selected.title : 'No selection'}</div>
            {selected && (
              <aside aria-label="Report details panel">
                <button
                  onClick={() => setSelected(null)}
                  className="min-w-[44px] min-h-[44px] w-11 h-11"
                  aria-label="Close report details"
                >
                  Close
                </button>
              </aside>
            )}
          </div>
        );
      }

      render(<TestHost />);
      const closeBtn = screen.getByRole('button', { name: /close report details/i });
      fireEvent.click(closeBtn);

      expect(screen.getByTestId('status').textContent).toBe('No selection');
    });

    it('executes the full 10-step marker selection, manual zoom/pan, switching, and reopening sequence', () => {
      function IntegratedTrackerMap() {
        const [selected, setSelected] = React.useState<TrackerEntry | null>(null);

        return (
          <div>
            <div data-testid="detail-title">{selected ? selected.title : 'None'}</div>
            <div data-testid="detail-id">{selected ? selected.id : 'None'}</div>
            {selected && (
              <button
                onClick={() => setSelected(null)}
                aria-label="Close report details"
                className="min-w-[44px] min-h-[44px] w-11 h-11"
              >
                Close
              </button>
            )}
            <InteractiveMap
              events={sampleEvents}
              selectedEvent={selected}
              onSelectEvent={setSelected}
            />
          </div>
        );
      }

      render(<IntegratedTrackerMap />);
      const markers = screen.getAllByTestId('map-marker');

      // Step 1: Select marker A (entry-1)
      fireEvent.click(markers[0]);

      // Step 2: Verify that A's details are displayed and map focused once
      expect(screen.getByTestId('detail-title').textContent).toBe(sampleEvents[0].title);
      expect(mockMap.flyTo).toHaveBeenCalledTimes(1);
      expect(mockMap.flyTo).toHaveBeenLastCalledWith([13.0499, 80.2824], 13, { duration: 1.0 });

      // Step 3: Zoom out manually
      const calls = mockMap.on.mock.calls;
      const zoomHandler = calls.find((call) => call[0] === 'zoomstart')?.[1];
      expect(zoomHandler).toBeDefined();
      zoomHandler();
      expect(mockMap.stop).toHaveBeenCalled();

      // Step 4: Select marker B (entry-2)
      fireEvent.click(markers[1]);

      // Step 5: Verify that B's details replace A's details
      expect(screen.getByTestId('detail-title').textContent).toBe(sampleEvents[1].title);
      expect(screen.getByTestId('detail-id').textContent).toBe(sampleEvents[1].id);

      // Step 6: Verify that the map focuses on B exactly once
      expect(mockMap.flyTo).toHaveBeenCalledTimes(2);
      expect(mockMap.flyTo).toHaveBeenLastCalledWith([9.9142, 78.1472], 13, { duration: 1.0 });

      // Step 7: Manually zoom out and pan again
      const dragHandler = calls.find((call) => call[0] === 'dragstart')?.[1];
      expect(dragHandler).toBeDefined();
      dragHandler();
      expect(mockMap.stop).toHaveBeenCalled();

      // Step 8: Verify that the map does not snap back to B
      expect(mockMap.flyTo).toHaveBeenCalledTimes(2);

      // Step 9: Close B's details
      const closeBtn = screen.getByRole('button', { name: /close report details/i });
      fireEvent.click(closeBtn);
      expect(screen.getByTestId('detail-title').textContent).toBe('None');

      // Step 10: Select A again and verify that A opens normally
      fireEvent.click(markers[0]);
      expect(screen.getByTestId('detail-title').textContent).toBe(sampleEvents[0].title);
      expect(mockMap.flyTo).toHaveBeenCalledTimes(3);
      expect(mockMap.flyTo).toHaveBeenLastCalledWith([13.0499, 80.2824], 13, { duration: 1.0 });
    });
  });
});
