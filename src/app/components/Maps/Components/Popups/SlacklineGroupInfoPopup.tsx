import React, { useEffect } from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Avatar from '@mui/material/Avatar';
import EmailIcon from '@mui/icons-material/Email';
import FacebookIcon from '@mui/icons-material/Facebook';
import TelegramIcon from '@mui/icons-material/Telegram';
import InstagramIcon from '@mui/icons-material/Instagram';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LinkIcon from '@mui/icons-material/Link';

import { LoadingIndicator } from 'app/components/LoadingIndicator';
import { format } from 'date-fns';
import { Box, Button, Link, Typography } from '@mui/material';
import { useState } from 'react';
import { Stack } from '@mui/system';
import { useMediaQuery } from 'utils/hooks/useMediaQuery';
import { appColors } from 'styles/theme/colors';

const groupEditGoogleFormUrl =
  ' https://docs.google.com/forms/d/e/1FAIpQLSdEPV1ZV8TjmkQUGmKP8L0LrrkyUlspnfGFZ3dw32ocJ_zXVQ/viewform?usp=pp_url&entry.677223950=Edit+existing+data&entry.1762852981=';

interface GroupInfo {
  id: string;
  name: string;
  lat: number;
  lng: number;
  createdDateTime: string;
  updatedDateTime: string;
  email?: string;
  facebook?: string;
  telegram?: string;
  instagram?: string;
  whatsapp?: string;
  webpage?: string;
}
interface Props {
  id: string;
}

let groupsJson: GroupInfo[] = [];

const getGroupInfo = async (id: string) => {
  if (groupsJson.length === 0) {
    const response = await fetch(
      'https://raw.githubusercontent.com/International-Slackline-Association/slackline-data/master/communities/groups/groups.json',
    ).then(r => r.json());
    groupsJson = response;
  }
  return groupsJson.find(c => c.id === id);
};

export const SlacklineGroupInfoPopup = (props: Props) => {
  const { isDesktop } = useMediaQuery();
  const [isLoading, setIsLoading] = useState(false);
  const [group, setGroup] = useState<GroupInfo>();

  useEffect(() => {
    setIsLoading(true);
    getGroupInfo(props.id).then(r => {
      if (r) {
        setGroup(r);
      }
      setIsLoading(false);
    });
  }, [props.id]);

  const InfoField = (props: { icon: any; url?: string; text?: string }) => {
    if (!props.url || !props.text) {
      return null;
    }
    return (
      <Stack direction={'row'} spacing={1} alignItems="center">
        <props.icon color="primary" />
        <Link href={props.url} target="_blank" rel="noopener">
          {props.text}
        </Link>
      </Stack>
    );
  };

  return (
    <Card
      sx={{
        width: isDesktop ? '300px' : '67vw',
      }}
    >
      {isLoading || !group ? (
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
                G
              </Avatar>
            }
            title={group.name}
            subheader={`Last updated: ${format(
              new Date(group.updatedDateTime ?? group.createdDateTime),
              'dd MMM yyyy',
            )}`}
          />
          <CardContent component={Stack} spacing={2} sx={{}}>
            <Stack spacing={1}>
              <InfoField
                icon={EmailIcon}
                text={group.email}
                url={`mailto:${group.email}`}
              />
              <InfoField
                icon={FacebookIcon}
                text="Facebook Page"
                url={group.facebook}
              />
              <InfoField
                icon={TelegramIcon}
                text={'Telegram Group'}
                url={group.telegram}
              />
              <InfoField
                icon={InstagramIcon}
                text={'Instagram Page'}
                url={group.instagram}
              />
              <InfoField
                icon={WhatsAppIcon}
                text={'WhatsApp Group'}
                url={group.whatsapp}
              />
              <InfoField
                icon={LinkIcon}
                text={'Web Page'}
                url={group.webpage}
              />
            </Stack>

            <Typography
              variant="caption"
              sx={{
                color: t => t.palette.text.secondary,
                fontSize: '0.7rem',
                fontStyle: 'italic',
              }}
            >
              All the data is public on{' '}
              <a
                href={
                  'https://github.com/International-Slackline-Association/slackline-data/tree/master/communities/groups'
                }
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
              . If you know how to use Github edit the data directly on there,
              otherwise fill in the form by clicking on the "Modify" button.
            </Typography>
          </CardContent>
          <CardActions sx={{ justifyContent: 'center', padding: 2 }}>
            <Button
              variant="contained"
              color="error"
              href={groupEditGoogleFormUrl + encodeURIComponent(group.name)}
              target="_blank"
              rel="noreferrer"
            >
              Modify
            </Button>
          </CardActions>
        </>
      )}
    </Card>
  );
};
