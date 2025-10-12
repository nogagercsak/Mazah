# Quick Debug: Is the New Code Running?

## Add This Temporary Test

1. Open `app/add-item.tsx`
2. Find line ~418 (the Item Name input group)
3. Add this RIGHT AFTER the `<View style={styles.labelRow}>` line:

```tsx
<View style={styles.labelRow}>
  {/* TEMPORARY DEBUG - REMOVE AFTER TESTING */}
  <Text style={{ fontSize: 12, color: 'red' }}>
    DEBUG: name="{name}" | hasText={name.trim() ? 'YES' : 'NO'}
  </Text>
  {/* END DEBUG */}
  
  <Text style={styles.label}>Item Name</Text>
```

4. Save and reload the app (Cmd+D → Reload)

## What You Should See

When you open "Add Food Item":
- You'll see red debug text showing `name="" | hasText=NO`

When you type "Milk":
- Debug text updates to `name="Milk" | hasText=YES`
- The star button SHOULD appear

## Results:

### ✅ If you see the debug text:
**Good!** The new code is loading. The button should appear when hasText=YES.

**If button still doesn't show:**
- The button styling might be wrong
- Try adding this debug too:

```tsx
{name.trim() ? (
  <Text style={{ fontSize: 10, color: 'blue' }}>BUTTON SHOULD BE HERE</Text>
) : null}
```

### ❌ If you DON'T see the debug text:
**Problem:** The new code isn't loading at all.

**Fix:**
1. Make sure the file is saved (check for • next to filename in editor)
2. Kill Metro bundler (Ctrl+C)
3. In Xcode: Product → Clean Build Folder
4. Restart Metro: `npx expo start --clear`
5. In Xcode: Product → Run

---

## Full Debug Version

Replace the entire inputGroup with this to see everything:

```tsx
<View style={styles.inputGroup}>
  <View style={styles.labelRow}>
    <Text style={styles.label}>Item Name</Text>
    
    {/* DEBUG INFO */}
    <View style={{ 
      backgroundColor: 'yellow', 
      padding: 4, 
      borderRadius: 4 
    }}>
      <Text style={{ fontSize: 10 }}>
        name={name.length} | check={checkingFavorite ? 'Y' : 'N'} | fav={isFavorited ? 'Y' : 'N'}
      </Text>
    </View>
    
    {/* STAR BUTTON - Should appear when name.trim() is true */}
    {name.trim() ? (
      <View style={{
        backgroundColor: 'lightgreen',
        padding: 8,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <Text style={{ fontSize: 12, fontWeight: 'bold' }}>
          ⭐ BUTTON HERE
        </Text>
      </View>
    ) : (
      <Text style={{ fontSize: 10, color: 'red' }}>
        (button hidden - type something)
      </Text>
    )}
  </View>
  
  <View style={styles.inputContainer}>
    <TextInput
      style={styles.input}
      placeholder="e.g., Organic Milk"
      value={name}
      onChangeText={setName}
      placeholderTextColor={proto.textSecondary}
      returnKeyType="next"
    />
  </View>
</View>
```

This will show:
- Yellow box with current state
- Green box with "⭐ BUTTON HERE" when you type
- Red text "(button hidden)" when field is empty

If you see this working, you know the logic is correct and we just need to style it properly.

---

## After Testing

Once you confirm it's working, remove all the debug code and the styled button will work normally.
