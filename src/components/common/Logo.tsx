import { Box, Image, ImageProps } from '@chakra-ui/react';
import logoImage from '../../assets/images/cyclebuddylogo.png';

interface LogoProps extends Omit<ImageProps, 'src'> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo = ({ size = 'md', ...rest }: LogoProps) => {
  // Map size to actual dimensions
  const sizeMap = {
    sm: { width: '100px' },
    md: { width: '150px' },
    lg: { width: '200px' },
    xl: { width: '250px' },
  };

  return (
    <Box {...sizeMap[size]}>
      <Image 
        src={logoImage} 
        alt="CycleBuddy Logo" 
        objectFit="contain"
        {...rest} 
      />
    </Box>
  );
};

export default Logo; 