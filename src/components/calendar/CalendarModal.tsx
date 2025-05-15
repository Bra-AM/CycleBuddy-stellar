import { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
} from '@chakra-ui/react';
import Calendar from 'react-calendar';
import type { Value } from 'react-calendar/dist/cjs/shared/types';
import 'react-calendar/dist/Calendar.css';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CalendarModal = ({ isOpen, onClose }: CalendarModalProps) => {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  const handleDateClick = (value: Value) => {
    // Ensure we're working with a single date
    if (value instanceof Date) {
      setSelectedDates(prevDates => {
        // Check if the date is already selected
        const isSelected = prevDates.some(
          selectedDate => selectedDate.toDateString() === value.toDateString()
        );

        if (isSelected) {
          // If selected, remove it
          return prevDates.filter(
            selectedDate => selectedDate.toDateString() !== value.toDateString()
          );
        } else {
          // If not selected, add it
          return [...prevDates, value];
        }
      });
    }
  };

  const tileClassName = ({ date }: { date: Date }) => {
    // Check if this date is in our selectedDates array
    const isSelected = selectedDates.some(
      selectedDate => selectedDate.toDateString() === date.toDateString()
    );
    return isSelected ? 'selected-date' : '';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Select Date</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Box className="calendar-container">
            <Calendar
              onChange={handleDateClick}
              value={null}
              className="custom-calendar"
              tileClassName={tileClassName}
            />
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default CalendarModal; 