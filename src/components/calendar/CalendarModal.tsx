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
  useColorModeValue,
  useToast,
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

interface CycleData {
  userId: string; // This would come from auth context in a real app
  date: string;
  data: DayData;
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
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const cardGradient = useColorModeValue(
    'linear(to-r, #8A2BE2, #D53F8C)',
    'linear(to-r, #8A2BE2, #D53F8C)'
  );

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
      const baseSize = 12; // Increased from 8 to 12 for light flow
      let size = baseSize;
      
      // Adjust size based on flow level
      if (data.flowLevel === 'regular') {
        size = baseSize * 3; // Triple size for regular (36px)
      } else if (data.flowLevel === 'heavy') {
        size = baseSize * 6; // 6x size for heavy (72px)
      }
      
      return (
        <Box 
          width={`${size}px`}
          height={`${size}px`}
          borderRadius="50%"
          bg="rgba(229, 62, 62, 0.4)"
          position="absolute"
          bottom="4px"
          left="50%"
          transform="translateX(-50%)"
          transition="all 0.2s ease-in-out"
          zIndex="1"
        />
      );
    }
    return null;
  };

  const renderPainScale = () => {
    const dateStr = selectedDate?.toISOString().split('T')[0] || '';
    const currentLevel = calendarData[dateStr]?.crampsLevel || 0;

    // Array of red shades from light pink to intense red
    const redShades = [
      '#FFF5F5', // red.50
      '#FED7D7', // red.100
      '#FEB2B2', // red.200
      '#FC8181', // red.300
      '#F56565', // red.400
      '#E53E3E', // red.500
      '#C53030', // red.600
      '#9B2C2C', // red.700
      '#822727', // red.800
      '#63171B', // red.900
    ];

    return (
      <HStack spacing={1} mt={2}>
        {[...Array(10)].map((_, index) => (
          <Box
            key={index}
            w="24px"
            h="12px"
            bg={index < currentLevel ? redShades[index] : "gray.200"}
            cursor="pointer"
            onClick={() => handleCrampsLevelChange((index + 1).toString())}
            _hover={{ opacity: 0.8 }}
            borderRadius="4px"
            border="1px solid black"
          />
        ))}
      </HStack>
    );
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Prepare data for API
      const cycleDataArray: CycleData[] = Object.entries(calendarData).map(([date, data]) => ({
        userId: "user123", // This would come from auth context
        date,
        data
      }));

      // Save to a JSON file
      const blob = new Blob([JSON.stringify(cycleDataArray, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'cycle_data.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Example of how the API call would look
      // try {
      //   const response = await fetch('http://localhost:3000/api/cycle', {
      //     method: 'POST',
      //     headers: {
      //       'Content-Type': 'application/json',
      //     },
      //     body: JSON.stringify(cycleDataArray),
      //   });
      //   if (!response.ok) throw new Error('Failed to save data');
      // } catch (error) {
      //   throw new Error('Failed to connect to the server');
      // }

      toast({
        title: "Data saved successfully",
        description: "Your cycle data has been exported to JSON",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error saving data",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent maxW="900px" bg="purple.50">
        <ModalHeader textAlign="center" bgGradient={cardGradient} bgClip="text">Track Your Cycle</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Flex>
            <Box flex="1" className="calendar-container">
              <style>
                {`
                  .react-calendar__tile {
                    border: 1px solid #CBD5E0;
                    border-radius: 4px;
                    margin: 1px;
                    padding: 8px 4px;
                  }
                  .react-calendar__month-view__days__day--weekend {
                    border: 1px solid #CBD5E0;
                  }
                  .react-calendar__tile:enabled:hover,
                  .react-calendar__tile:enabled:focus,
                  .react-calendar__tile--active {
                    border: 1px solid #4A5568;
                  }
                `}
              </style>
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
                        <Text fontSize="sm" mb={1}>Pain Level:</Text>
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
              <Button 
                colorScheme="purple"
                onClick={handleSave}
                isLoading={isSaving}
                loadingText="Saving..."
              >
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