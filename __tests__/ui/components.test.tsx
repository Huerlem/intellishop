/**
 * V2 component library behaviour and accessibility (src/ui).
 */
import { fireEvent, render, screen } from '@testing-library/react-native';

import { colors } from '@/src/theme';
import { Alert, Badge, Button, ListItemRow, ProgressBar, ShoppingModeItem, TextField } from '@/src/ui';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

const flatStyle = (node: { props: { style?: unknown } }) => Object.assign({}, ...([] as unknown[]).concat(node.props.style as never).flat(Infinity).filter(Boolean));

describe('Button (Figma 100:56)', () => {
  it('fires onPress and exposes role and label', async () => {
    const onPress = jest.fn();
    await render(<Button title="Start Shopping" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Start Shopping' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire when disabled or loading and reports the state', async () => {
    const onPress = jest.fn();
    await render(
      <>
        <Button title="Disabled" onPress={onPress} disabled />
        <Button title="Busy" onPress={onPress} loading />
      </>
    );
    const disabled = screen.getByLabelText('Disabled');
    const busy = screen.getByLabelText('Busy');
    await fireEvent.press(disabled);
    await fireEvent.press(busy);
    expect(onPress).not.toHaveBeenCalled();
    expect(disabled.props.accessibilityState).toMatchObject({ disabled: true });
    expect(busy.props.accessibilityState).toMatchObject({ busy: true });
    expect(screen.getByText('Loading…')).toBeTruthy();
  });

  it('uses the Figma colours for primary, secondary and destructive', async () => {
    await render(
      <>
        <Button title="P" variant="primary" />
        <Button title="S" variant="secondary" />
        <Button title="D" variant="destructive" />
      </>
    );
    expect(flatStyle(screen.getByLabelText('P'))).toMatchObject({ backgroundColor: colors.action.primary, minHeight: 48, borderRadius: 8 });
    expect(flatStyle(screen.getByLabelText('S'))).toMatchObject({ backgroundColor: colors.surface.card, borderColor: colors.action.primary, borderWidth: 1 });
    expect(flatStyle(screen.getByLabelText('D'))).toMatchObject({ backgroundColor: colors.status.error });
  });
});

describe('status is never colour alone', () => {
  it('badges and alerts carry text', async () => {
    await render(
      <>
        <Badge label="Running low" tone="warning" />
        <Alert tone="error" title="Could not save" detail="Try again" />
      </>
    );
    expect(screen.getByText('Running low')).toBeTruthy();
    expect(screen.getByLabelText('Error. Could not save. Try again')).toBeTruthy();
  });

  it('progress exposes its value to assistive technology', async () => {
    await render(<ProgressBar done={3} total={4} label="3 done · 1 remaining" />);
    const bar = screen.getByRole('progressbar');
    expect(bar.props.accessibilityValue).toMatchObject({ min: 0, max: 4, now: 3, text: '3 done · 1 remaining' });
  });
});

describe('ListItemRow (Figma 100:167)', () => {
  it('separates the checkbox from the edit action', async () => {
    const onToggle = jest.fn();
    const onPress = jest.fn();
    await render(<ListItemRow name="Milk" meta="2 l" accessibilityMeta="2 litres" checked={false} onToggle={onToggle} onPress={onPress} />);
    const box = screen.getByRole('checkbox');
    expect(box.props.accessibilityLabel).toBe('Milk, 2 litres');
    expect(box.props.accessibilityState).toMatchObject({ checked: false });
    await fireEvent.press(box);
    await fireEvent.press(screen.getByLabelText('Edit Milk'));
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows "Done" when checked', async () => {
    await render(<ListItemRow name="Milk" checked onToggle={() => {}} />);
    expect(screen.getByText('Done')).toBeTruthy();
  });
});

describe('ShoppingModeItem (Figma 102:29)', () => {
  const base = { name: 'Bread', meta: '1 item', onToggle: jest.fn(), onExpand: jest.fn(), onSubstitute: jest.fn(), onUnavailable: jest.fn(), onQuantity: jest.fn() };

  it('shows exception actions when expanded and labels them for VoiceOver', async () => {
    await render(<ShoppingModeItem {...base} state="pending" expanded />);
    expect(screen.getByText('Choose an action')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Mark Bread unavailable'));
    expect(base.onUnavailable).toHaveBeenCalled();
    expect(screen.getByLabelText('Substitute Bread')).toBeTruthy();
    expect(screen.getByLabelText('Change quantity of Bread')).toBeTruthy();
  });

  it('offers the exceptions as an accessibility action (no long-press needed)', async () => {
    await render(<ShoppingModeItem {...base} state="pending" expanded={false} />);
    const row = screen.getByRole('checkbox');
    expect(row.props.accessibilityActions).toEqual([{ name: 'longpress', label: 'Show options' }]);
    row.props.onAccessibilityAction({ nativeEvent: { actionName: 'longpress' } });
    expect(base.onExpand).toHaveBeenCalled();
  });

  it('states the outcome in text', async () => {
    await render(<ShoppingModeItem {...base} state="substituted" substituteName="Rye bread" expanded={false} />);
    expect(screen.getByText('Substituted')).toBeTruthy();
    expect(screen.getByText('Bought Rye bread instead')).toBeTruthy();
  });
});

describe('TextField (Figma 100:89)', () => {
  it('shows the error message and announces it in the hint', async () => {
    await render(<TextField label="Item name" value="" onChangeText={() => {}} error="Enter a valid item" testID="field" />);
    expect(screen.getByText('Enter a valid item')).toBeTruthy();
    expect(screen.getByTestId('field').props.accessibilityHint).toBe('Error: Enter a valid item');
  });
});
