import React, { useEffect } from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import { LoadingIndicator } from 'app/components/LoadingIndicator';
import { Box, Button, Menu, MenuItem, Typography } from '@mui/material';
import { useState } from 'react';
import { Stack } from '@mui/system';

import { useMediaQuery } from 'utils/hooks/useMediaQuery';
import { appColors } from 'styles/theme/colors';

interface OrganizationInfo {
  id: string;
  name: string;
  email: string;
}
interface Props {
  countryName: string;
  organizationIds: string[];
}

let assocationsInfo: { [key: string]: OrganizationInfo } = {};

const getOrganizationsInfo = async () => {
  if (Object.keys(assocationsInfo).length === 0) {
    const response = await fetch(
      'https://raw.githubusercontent.com/International-Slackline-Association/slackline-data/master/communities/organizations/organizations.json',
    ).then(r => r.json());
    for (const a of response) {
      assocationsInfo[a.id] = a;
    }
  }
  return assocationsInfo;
};

export const ManagedCountryInfoPopup = (props: Props) => {
  const { isDesktop } = useMediaQuery();
  const [isLoading, setIsLoading] = useState(false);
  const [organizations, setOrganizations] = useState<OrganizationInfo[]>([]);

  useEffect(() => {
    setIsLoading(true);

    const fetchOrganizations = async () => {
      const organizationInfo = await getOrganizationsInfo();
      setOrganizations(
        props.organizationIds.map(id => {
          return { ...organizationInfo[id] };
        }),
      );
      setIsLoading(false);
    };

    fetchOrganizations();
  }, [props.organizationIds]);

  return (
    <Card
      sx={{
        width: isDesktop ? '300px' : '67vw',
      }}
    >
      {isLoading || organizations.length === 0 ? (
        <CardContent>
          <LoadingIndicator />
        </CardContent>
      ) : (
        <>
          <CardHeader
            avatar={
              <Avatar
                src=""
                sx={{
                  backgroundColor: appColors.isaBlue,
                }}
              >
                C
              </Avatar>
            }
            title={`Organizations of ${props.countryName}`}
          />
          <CardContent component={Stack} spacing={2} sx={{}}>
            <Typography variant="caption">
              ISA Members below have rights to edit & delete the features inside
              the marked region.
            </Typography>
            <Stack
              spacing={1}
              sx={{ maxHeight: { xs: '33vh', lg: '66vh' }, overflow: 'scroll' }}
            >
              {organizations.map(organization => (
                <Typography
                  key={organization.id}
                  variant="body2"
                  color={t => t.palette.text.secondary}
                >
                  <b>{organization.name}</b>({organization.email})
                </Typography>
              ))}
            </Stack>

            <Typography
              variant="caption"
              sx={{
                color: t => t.palette.text.secondary,
                fontSize: '0.7rem',
                fontStyle: 'italic',
              }}
            >
              This information is retrieved from the{' '}
              <a
                href={
                  'https://github.com/International-Slackline-Association/slackline-data/tree/master/communities/organizations'
                }
                target="_blank"
                rel="noreferrer"
              >
                public ISA Organizations data
              </a>
              . If you think it is incorrect, please contact the ISA as
              described in the link.
            </Typography>
          </CardContent>
        </>
      )}
    </Card>
  );
};
