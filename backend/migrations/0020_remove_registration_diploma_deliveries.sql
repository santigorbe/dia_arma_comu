DELETE FROM diploma_deliveries AS delivery
USING diploma_campaigns AS campaign
WHERE delivery.campaign_id = campaign.id
  AND campaign.origin = 'registration';

DELETE FROM diploma_campaigns
WHERE origin = 'registration';
