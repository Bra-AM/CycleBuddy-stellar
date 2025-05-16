import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  Flex,
  VStack,
  HStack,
  Checkbox,
  Button,
  Text,
  Radio,
  RadioGroup,
  Stack,
  ButtonGroup,
} from '@chakra-ui/react';
import 'react-calendar/dist/Calendar.css';
import './styles/calendar.css';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DayData {
  flow: boolean;
  flowLevel?: 'light' | 'regular' | 'heavy';
  cramps: boolean;
  crampsLevel?: number;
  mood: boolean;
  moodType?: 'fair' | 'good' | 'great';
}

type CalendarData = {
  [date: string]: DayData;
};

export const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarData>(() => {
    const savedData = localStorage.getItem('calendarData');
    return savedData ? JSON.parse(savedData) : {};
  });

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('calendarData', JSON.stringify(calendarData));
  }, [calendarData]);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    // Initialize data for new date if it doesn't exist
    const dateStr = date.toISOString().split('T')[0];
    if (!calendarData[dateStr]) {
      setCalendarData(prev => ({
        ...prev,
        [dateStr]: { 
          flow: false,
          cramps: false,
          mood: false
        }
      }));
    }
  };

  const handleCheckboxChange = (field: keyof DayData) => {
    if (!selectedDate) return;
    
    const dateStr = selectedDate.toISOString().split('T')[0];
    setCalendarData(prev => ({
      ...prev,
      [dateStr]: {
        ...prev[dateStr],
        [field]: !prev[dateStr][field],
        // Reset related fields when unchecking
        ...(field === 'flow' && !prev[dateStr].flow ? {} : { flowLevel: prev[dateStr].flowLevel }),
        ...(field === 'cramps' && !prev[dateStr].cramps ? {} : { crampsLevel: prev[dateStr].crampsLevel }),
        ...(field === 'mood' && !prev[dateStr].mood ? {} : { moodType: prev[dateStr].moodType })
      }
    }));
  };

  const handleFlowLevelChange = (value: 'light' | 'regular' | 'heavy') => {
    if (!selectedDate) return;
    
    const dateStr = selectedDate.toISOString().split('T')[0];
    setCalendarData(prev => ({
      ...prev,
      [dateStr]: {
        ...prev[dateStr],
        flowLevel: value
      }
    }));
  };

  const handleCrampsLevelChange = (value: string) => {
    if (!selectedDate) return;
    
    const dateStr = selectedDate.toISOString().split('T')[0];
    setCalendarData(prev => ({
      ...prev,
      [dateStr]: {
        ...prev[dateStr],
        crampsLevel: parseInt(value)
      }
    }));
  };

  const handleMoodTypeChange = (value: 'fair' | 'good' | 'great') => {
    if (!selectedDate) return;
    
    const dateStr = selectedDate.toISOString().split('T')[0];
    setCalendarData(prev => ({
      ...prev,
      [dateStr]: {
        ...prev[dateStr],
        moodType: value
      }
    }));
  };

  const handleClearDate = () => {
    if (!selectedDate) return;
    
    const dateStr = selectedDate.toISOString().split('T')[0];
    setCalendarData(prev => ({
      ...prev,
      [dateStr]: {
        flow: false,
        flowLevel: undefined,
        cramps: false,
        crampsLevel: undefined,
        mood: false,
        moodType: undefined
      }
    }));
  };

  const tileContent = ({ date }: { date: Date }) => {
    const dateStr = date.toISOString().split('T')[0];
    const data = calendarData[dateStr];
    
    if (data?.flow) {
      const baseSize = 8; // Base size in pixels
      let size = baseSize;
      
      // Adjust size based on flow level
      if (data.flowLevel === 'regular') {
        size = baseSize * 3; // Triple size for regular
      } else if (data.flowLevel === 'heavy') {
        size = baseSize * 6; // 6x size for heavy
      }
      
      return (
        <Box 
          width={`${size}px`}
          height={`${size}px`}
          borderRadius="50%"
          bg="red.500"
          position="absolute"
          bottom="4px"
          left="50%"
          transform="translateX(-50%)"
          transition="all 0.2s ease-in-out"
        />
      );
    }
    return null;
  };

  const renderPainScale = () => {
    const dateStr = selectedDate?.toISOString().split('T')[0] || '';
    const currentLevel = calendarData[dateStr]?.crampsLevel || 0;

    return (
      <HStack spacing={1} mt={2}>
        {[...Array(10)].map((_, index) => (
          <Box
            key={index}
            w="20px"
            h="20px"
            bg={index < currentLevel ? "red.500" : "gray.200"}
            cursor="pointer"
            onClick={() => handleCrampsLevelChange((index + 1).toString())}
            _hover={{ opacity: 0.8 }}
          />
        ))}
      </HStack>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent maxW="900px">
        <ModalHeader>Track Your Cycle</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Flex>
            <Box flex="1" className="calendar-container">
              <Calendar
                className="custom-calendar"
                onClickDay={handleDateClick}
                value={selectedDate}
                tileContent={tileContent}
              />
            </Box>
            
            {selectedDate && (
              <Box ml={6} width="250px">
                <Text mb={4} fontWeight="bold">
                  {selectedDate.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
                <VStack align="start" spacing={4}>
                  <Box width="100%">
                    <Checkbox
                      isChecked={calendarData[selectedDate.toISOString().split('T')[0]]?.flow}
                      onChange={() => handleCheckboxChange('flow')}
                      mb={2}
                    >
                      Flow
                    </Checkbox>
                    {calendarData[selectedDate.toISOString().split('T')[0]]?.flow && (
                      <RadioGroup
                        value={calendarData[selectedDate.toISOString().split('T')[0]]?.flowLevel || ''}
                        onChange={handleFlowLevelChange}
                        ml={6}
                      >
                        <Stack>
                          <Radio value="light">Light</Radio>
                          <Radio value="regular">Regular</Radio>
                          <Radio value="heavy">Heavy</Radio>
                        </Stack>
                      </RadioGroup>
                    )}
                  </Box>

                  <Box width="100%">
                    <Checkbox
                      isChecked={calendarData[selectedDate.toISOString().split('T')[0]]?.cramps}
                      onChange={() => handleCheckboxChange('cramps')}
                      mb={2}
                    >
                      Cramps
                    </Checkbox>
                    {calendarData[selectedDate.toISOString().split('T')[0]]?.cramps && (
                      <Box ml={6}>
                        <Text fontSize="sm" mb={1}>Pain Level (1-10):</Text>
                        {renderPainScale()}
                      </Box>
                    )}
                  </Box>

                  <Box width="100%">
                    <Checkbox
                      isChecked={calendarData[selectedDate.toISOString().split('T')[0]]?.mood}
                      onChange={() => handleCheckboxChange('mood')}
                      mb={2}
                    >
                      Mood
                    </Checkbox>
                    {calendarData[selectedDate.toISOString().split('T')[0]]?.mood && (
                      <RadioGroup
                        value={calendarData[selectedDate.toISOString().split('T')[0]]?.moodType || ''}
                        onChange={handleMoodTypeChange}
                        ml={6}
                      >
                        <Stack>
                          <Radio value="fair">Fair</Radio>
                          <Radio value="good">Good</Radio>
                          <Radio value="great">Great</Radio>
                        </Stack>
                      </RadioGroup>
                    )}
                  </Box>
                </VStack>
              </Box>
            )}
          </Flex>
          
          <Box position="absolute" bottom="6" right="6">
            <ButtonGroup spacing={3}>
              <Button 
                variant="outline" 
                colorScheme="red" 
                onClick={handleClearDate}
                isDisabled={!selectedDate}
              >
                Clear
              </Button>
              <Button colorScheme="purple">
                Save
              </Button>
            </ButtonGroup>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default CalendarModal; 