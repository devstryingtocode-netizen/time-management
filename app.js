const form = {
  customStartTime: document.getElementById('customStartTime'),
  customEndTime: document.getElementById('customEndTime'),
  freeHours: document.getElementById('freeHours'),
  generateButton: document.getElementById('generatePlan'),
  summary: document.getElementById('summary'),
  scheduleList: document.getElementById('scheduleList'),
  customTimeGroup: document.getElementById('customTimeGroup')
};

let hasGeneratedSchedule = false;

function getSelectedPreference() {
  return document.querySelector('input[name="studyPreference"]:checked')?.value || 'day';
}

function toMinutes(timeValue) {
  const [hours, minutes] = timeValue.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatClock(minutes) {
  const totalSeconds = ((Math.round(minutes * 60) % 86400) + 86400) % 86400;
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const clock = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  return seconds ? `${clock}:${String(seconds).padStart(2, '0')}` : clock;
}

function roundedHours(value) {
  return Number(value.toFixed(3));
}

function getActiveStudyWindow() {
  const preference = getSelectedPreference();

  if (preference === 'custom') {
    return {
      start: form.customStartTime.value || '19:00',
      end: form.customEndTime.value || '22:00',
      label: 'Custom comfortable time'
    };
  }

  if (preference === 'night') {
    return {
      start: '20:00',
      end: '23:00',
      label: 'Night study time'
    };
  }

  return {
    start: '08:00',
    end: '14:00',
    label: 'Day study time'
  };
}

function buildStudySchedule(startTime, endTime, studyHours, preferenceLabel, isCustomTime) {
  const startMinutes = toMinutes(startTime);
  const totalStudyMinutes = Math.max(studyHours * 60, 0);
  const blockMinutes = totalStudyMinutes / 4;
  let breakMinutes = totalStudyMinutes / 8;

  if (isCustomTime) {
    let endMinutes = toMinutes(endTime);
    if (endMinutes <= startMinutes) endMinutes += 1440;

    const customWindowMinutes = endMinutes - startMinutes;
    if (totalStudyMinutes >= customWindowMinutes) {
      return {
        blocks: [],
        error: 'Choose a custom time window longer than your study hours so there is room for breaks.'
      };
    }

    breakMinutes = (customWindowMinutes - totalStudyMinutes) / 3;
  }

  const blocks = Array.from({ length: 4 }, (_, index) => {
    const blockStart = startMinutes + index * (blockMinutes + breakMinutes);
    const blockEnd = blockStart + blockMinutes;
    return {
      label: `Study block ${index + 1}`,
      time: `${formatClock(blockStart)}-${formatClock(blockEnd)}`,
      hours: roundedHours(blockMinutes / 60),
      description: preferenceLabel
    };
  });

  return { blocks, error: null };
}

function renderPlan() {
  if (!hasGeneratedSchedule) {
    form.summary.innerHTML = '';
    form.scheduleList.innerHTML = '';
    return;
  }

  const { start, end, label } = getActiveStudyWindow();
  const studyHours = Number(form.freeHours.value) || 0;
  const { blocks, error } = buildStudySchedule(
    start,
    end,
    studyHours,
    label,
    getSelectedPreference() === 'custom'
  );

  if (error) {
    form.summary.innerHTML = `<div class="summary-card"><strong role="alert">${error}</strong></div>`;
    form.scheduleList.innerHTML = '';
    return;
  }

  form.summary.innerHTML = `
    <div class="summary-card">
      <h3>Study hours</h3>
      <strong>${studyHours}h</strong>
    </div>
    <div class="summary-card">
      <h3>Study mode</h3>
      <strong>${label}</strong>
    </div>
    <div class="summary-card">
      <h3>Blocks</h3>
      <strong>${blocks.length} study session${blocks.length === 1 ? '' : 's'}</strong>
    </div>
  `;

  form.scheduleList.innerHTML = blocks
    .map(
      (item) => `
        <li class="schedule-item">
          <div>
            <div class="time">${item.time}</div>
            <div class="label">${item.label}</div>
            <small>${item.description}</small>
          </div>
          <div class="hours">${item.hours}h</div>
        </li>
      `
    )
    .join('');
}

function toggleCustomTimeFields() {
  const preference = getSelectedPreference();
  const shouldShowCustom = preference === 'custom';
  form.customTimeGroup.hidden = !shouldShowCustom;

  document.querySelectorAll('.toggle-option').forEach((option) => {
    const radio = option.querySelector('input');
    option.classList.toggle('active', radio.checked);
  });
}

function bindPreferenceToggle() {
  document.querySelectorAll('input[name="studyPreference"]').forEach((input) => {
    input.addEventListener('change', () => {
      toggleCustomTimeFields();
      if (hasGeneratedSchedule) {
        renderPlan();
      }
    });
  });
}

form.customStartTime.addEventListener('input', () => {
  if (hasGeneratedSchedule) renderPlan();
});
form.customEndTime.addEventListener('input', () => {
  if (hasGeneratedSchedule) renderPlan();
});
form.freeHours.addEventListener('input', () => {
  if (hasGeneratedSchedule) renderPlan();
});

form.generateButton.addEventListener('click', () => {
  hasGeneratedSchedule = true;
  renderPlan();
});

bindPreferenceToggle();
toggleCustomTimeFields();
renderPlan();
