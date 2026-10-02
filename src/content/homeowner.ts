import { src } from './helpers'
import type { RevisionTag, SourceRef } from './types'

// Messages a specialist copies and sends to a homeowner. Many homeowners are older, so every message is short, uses
// everyday words, and has numbered steps. Each one is built from a sourced fact (the sources are for the specialist,
// not part of the copied text). `homeowner.test.ts` enforces short sentences and bans technical words.

export interface HomeownerMessage {
  id: string
  group: string
  title: string
  /** What the homeowner says that makes you use this one. */
  customerSays: string
  /** Plain text, ready to paste. Blank lines separate paragraphs. */
  text: string
  /** Where the facts come from (specialist-facing). */
  sources: SourceRef[]
  revisions: RevisionTag
  /** Gaps the specialist should know about. */
  todo?: string[]
}

const TSM = (...p: number[]) => src('tsm', ...p)
const SET = (...p: number[]) => src('settings', ...p)

export const HOMEOWNER_MESSAGES: HomeownerMessage[] = [
  {
    id: 'h-wifi',
    group: 'Internet',
    title: 'Change your Wi-Fi name or password (EMS-C, Rev 4)',
    customerSays: 'I got a new router. / I changed my Wi-Fi password. / My system says it is offline.',
    text: `Here is how to change the Wi-Fi on your Lion system. You can use a phone or a laptop.

Stand next to your Lion system.

1. Take off the cover under the lights on the front. It has 4 screws. You need a 4 mm hex key.
2. Find the small box called the EMS-C. Press the Mode button under the network plug. A blue light should start to flash.
3. Open the Lion Smart app.
4. Tap System, then tap the gear icon at the top right.
5. Tap Network Connection. Follow the steps on the screen.
6. When it says connected, close the app. Press the Reset button at the bottom of the box, next to the power switch.
7. Wait 5 minutes. Your system should show online in the app.

If it still will not connect, call us.`,
    sources: [{ source: 'author', note: 'Wi-Fi procedure, updated by the author' }, TSM(61)],
    revisions: ['rev4'],
    todo: ['The Technical Service Manual says the Android Lion Smart app cannot yet change the Wi-Fi. Confirm whether this still applies, and what to tell Android users.', 'Screenshots of the app screens.'],
  },
  {
    id: 'h-wifi-wcm',
    group: 'Internet',
    title: 'Change your Wi-Fi name or password (WCM, Rev 3)',
    customerSays: 'I got a new router. / I changed my Wi-Fi password. / My system is offline. (Rev 3 with a WCM)',
    text: `Here is how to change the Wi-Fi on your Lion system.

Stand next to your Lion system.

1. Take off the cover under the lights on the front. It has 4 screws. You need a 4 mm hex key.
2. Find the small board called the WCM. Press the left button next to its light. The light should blink white.
3. Open the Lion Smart app.
4. Tap System, then tap the gear icon at the top right.
5. Tap Network Connection. Follow the steps on the screen.
6. When it says connected, close the app. Press the Reset button on the WCM.
7. The light goes white, then green when it is online. This can take about 2 minutes.

The app may take a few more minutes to show online.

If it still will not connect, call us.`,
    sources: [{ source: 'author', note: 'Wi-Fi procedure, updated by the author' }],
    revisions: ['rev3'],
    todo: ['Revs 1-2 (WCM): the author gave steps for Rev 3 only.', 'Screenshots of the app screens.'],
  },
  {
    id: 'h-light',
    group: 'Internet',
    title: 'What the light on the communication box means',
    customerSays: 'What does the light mean? / The light is red.',
    text: `Look at the small light on the Lion communication box.

Blue and steady: it is connected. All is well.
Red and steady: it is not connected to the internet.
Yellow, blinking: it is trying to connect. Please wait a few minutes.
Yellow and steady: it is updating. Please wait.
No light: it is not set up yet.

If the light stays red, call us.`,
    sources: [src('emsc', 6)],
    revisions: ['rev4'],
    todo: ['Revs 1-3 (WCM): what the WCM light shows.'],
  },
  {
    id: 'h-graph',
    group: 'Your app',
    title: 'The grid line on your graph',
    customerSays: 'What do the numbers on the graph mean? / Why is the grid number negative?',
    text: `Look at the line called Grid.

A number below zero (with a minus sign) means you are using power from the power company.

A number above zero means you are sending extra power to the power company.`,
    sources: [TSM(14)],
    revisions: 'all',
    todo: ['The author\'s own way of explaining the other graph lines.'],
  },
  {
    id: 'h-reserve',
    group: 'Your app',
    title: 'Battery reserve',
    customerSays: 'How much battery should I keep? / What is reserve?',
    text: `Battery reserve is the lowest charge your battery tries to keep.

Many homes choose 30%. It is your choice.

You can change it yourself in your settings.`,
    sources: [SET(12, 22), src('author')],
    revisions: 'all',
  },
  {
    id: 'h-emergency',
    group: 'Your app',
    title: 'Emergency mode',
    customerSays: 'A storm is coming. How do I keep my battery full?',
    text: `Emergency mode keeps your battery full in case the power goes out.

While it is on, your solar power is not saved in the battery.

Use it for a short time only. Lion Energy says no more than one week.

Turn it off when the storm is over.`,
    sources: [SET(12, 37), TSM(13)],
    revisions: 'all',
  },
  {
    id: 'h-share',
    group: 'Your app',
    title: 'Let someone else see your system',
    customerSays: 'Can my son or daughter look at my system?',
    text: `You can share your system with another person.

1. Go to smart.lionenergy.com.
2. Open the page for your system.
3. Click Menu.
4. Click Share Access.
5. Type the email address of the person.`,
    sources: [TSM(12), SET(11)],
    revisions: 'all',
  },
  {
    id: 'h-unshare',
    group: 'Your app',
    title: 'Stop sharing your system with someone',
    customerSays: 'How do I take someone off my system?',
    text: `You can take away someone's access at any time.

1. Go to smart.lionenergy.com.
2. Open the page for your system.
3. Click Menu.
4. Click Share Access.
5. Click the small arrow next to the person's name.
6. Click Remove.`,
    sources: [TSM(12), { source: 'author', note: 'Share access removal, by the author' }],
    revisions: 'all',
  },
  {
    id: 'h-change',
    group: 'Your app',
    title: 'What you can change yourself',
    customerSays: 'Can I change the settings? / Why can I not change this?',
    text: `You can change three things yourself:

1. Your Wi-Fi.
2. Your operating mode.
3. Your battery reserve.

Everything else is set by your installer or by Lion Energy. Call us and we will help.`,
    sources: [SET(10, 11)],
    revisions: 'all',
  },
  {
    id: 'h-support',
    group: 'Help',
    title: 'How to reach Lion Energy support',
    customerSays: 'What is your phone number? / When are you open?',
    text: `Lion Energy ESS Support
Phone: (435) 244-3352
Monday to Friday, 8:00 AM to 5:00 PM Mountain Time.`,
    sources: [src('emsc', 16)],
    revisions: 'all',
  },
]
