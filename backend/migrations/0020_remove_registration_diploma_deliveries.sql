DELETE FROM diploma_delivery_attempts
WHERE delivery_id IN (
  SELECT delivery.id
  FROM diploma_deliveries AS delivery
  JOIN diploma_campaigns AS campaign ON campaign.id = delivery.campaign_id
  WHERE campaign.origin = 'registration'
);

DELETE FROM diploma_deliveries AS delivery
USING diploma_campaigns AS campaign
WHERE delivery.campaign_id = campaign.id
  AND campaign.origin = 'registration';

DELETE FROM diploma_campaigns
WHERE origin = 'registration';
