import { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Box,
  Button,
} from '@chakra-ui/react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CalendarModal = ({ isOpen, onClose }: CalendarModalProps) => {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  const handleDateClick = (date: Date) => {
    const dateStr = date.toDateString();
    setSelectedDates(prevDates => {
      const isSelected = prevDates.some(d => d.toDateString() === dateStr);
      if (isSelected) {
        return prevDates.filter(d => d.toDateString() !== dateStr);
      }
      return [...prevDates, date];
    });
  };

  const tileClassName = ({ date }: { date: Date }) => {
    return selectedDates.some(d => d.toDateString() === date.toDateString()) ? 'selected-date' : '';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Select Dates</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Box className="calendar-container">
            <Calendar
              onClickDay={handleDateClick}
              tileClassName={tileClassName}
              className="custom-calendar"
            />
          </Box>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="pink" onClick={onClose}>
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CalendarModal; 