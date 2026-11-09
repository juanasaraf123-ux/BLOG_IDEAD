import { fireEvent, render, screen } from '@testing-library/react';
import { DataTable } from '../shared/DataTable';
import { Pending } from '../shared/ui';
import { DistributionBars } from '../portal/components/Charts';

describe('componentes compartidos', () => {
  const rows = [{ name: 'Ibagué', n: 10 }, { name: 'Chaparral', n: 30 }, { name: 'Honda', n: 20 }];
  it('la tabla filtra y ordena', () => {
    render(<DataTable rows={rows} columns={[{ key: 'name', label: 'CAT' }, { key: 'n', label: 'Valor' }]} />);
    fireEvent.change(screen.getByPlaceholderText('Filtrar…'), { target: { value: 'hon' } });
    expect(screen.getAllByRole('row')).toHaveLength(2);
    fireEvent.change(screen.getByPlaceholderText('Filtrar…'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /Valor/ }));
    const cells = screen.getAllByRole('cell').filter((_, i) => i % 2 === 0).map((c) => c.textContent);
    expect(cells).toEqual(['Ibagué', 'Honda', 'Chaparral']);
  });
  it('el estado pendiente nunca muestra cifras', () => {
    render(<Pending />);
    expect(screen.getByText('Información pendiente de actualización')).toBeInTheDocument();
  });
  it('la distribución agrupa por variable y calcula porcentajes', () => {
    render(<DistributionBars valueType="count" data={[{ label: 'Sexo: Femenino', value: 75 }, { label: 'Sexo: Masculino', value: 25 }, { label: 'Zona: Rural', value: 10 }]} />);
    expect(screen.getByText('Sexo')).toBeInTheDocument();
    expect(screen.getByText('Zona')).toBeInTheDocument();
    expect(screen.getByText('75.0 %')).toBeInTheDocument();
  });
});
