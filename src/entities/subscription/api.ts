import { SubscriptionRepository } from "./repository";
import { Subscription } from "./model";

export const subscriptionApi = {
  add: SubscriptionRepository.add,
  getByChatId: SubscriptionRepository.getByChatId,
  remove: SubscriptionRepository.remove,
  getAllChatIds: SubscriptionRepository.getAllChatIds,
  getUserTimezone: SubscriptionRepository.getUserTimezone,
  setUserTimezone: SubscriptionRepository.setUserTimezone,
};
