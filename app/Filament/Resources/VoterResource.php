<?php

namespace App\Filament\Resources;

use App\Filament\Resources\VoterResource\Pages;
use App\Models\Tps;
use App\Models\Voter;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class VoterResource extends Resource
{
    protected static ?string $model = Voter::class;

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->with(['tps']);
    }

    protected static ?string $navigationIcon = 'heroicon-o-users';

    protected static ?string $navigationGroup = 'Data Pemilihan (Pilkel)';

    protected static ?string $navigationLabel = 'Data Pemilih (DPT)';

    protected static ?string $modelLabel = 'Pemilih';

    protected static ?string $pluralModelLabel = 'Daftar Pemilih Tetap (DPT)';

    protected static ?int $navigationSort = 1;

    protected static ?string $recordTitleAttribute = 'nama';

    public static function getGloballySearchableAttributes(): array
    {
        return ['nama', 'nik', 'nkk'];
    }

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('nkk')
                    ->label('Nomor Kartu Keluarga (NKK)')
                    ->required()
                    ->length(16)
                    ->numeric()
                    ->placeholder('16 digit NKK'),

                Forms\Components\TextInput::make('nik')
                    ->label('Nomor Induk Kependudukan (NIK)')
                    ->required()
                    ->length(16)
                    ->numeric()
                    ->unique(ignoreRecord: true)
                    ->placeholder('16 digit NIK'),

                Forms\Components\TextInput::make('nama')
                    ->label('Nama Lengkap')
                    ->required()
                    ->maxLength(255)
                    ->placeholder('Nama sesuai KTP'),

                Forms\Components\Select::make('jenis_kelamin')
                    ->label('Jenis Kelamin')
                    ->options([
                        'L' => 'Laki-laki (L)',
                        'P' => 'Perempuan (P)',
                    ])
                    ->required(),

                Forms\Components\TextInput::make('tempat_lahir')
                    ->label('Tempat Lahir')
                    ->maxLength(255),

                Forms\Components\DatePicker::make('tanggal_lahir')
                    ->label('Tanggal Lahir')
                    ->displayFormat('d/m/Y'),

                Forms\Components\Select::make('status_perkawinan')
                    ->label('Status Perkawinan')
                    ->options([
                        'B' => 'Belum Kawin (B)',
                        'S' => 'Sudah Kawin (S)',
                        'P' => 'Pernah Kawin (P)',
                    ])
                    ->default('B')
                    ->required(),

                Forms\Components\TextInput::make('dusun')
                    ->label('Banjar / Dusun')
                    ->placeholder('Contoh: Banjar Pikat'),

                Forms\Components\Select::make('tps_id')
                    ->label('TPS Terdaftar')
                    ->relationship('tps', 'nomor_tps')
                    ->getOptionLabelFromRecordUsing(fn (Tps $record) => "{$record->nomor_tps} - {$record->nama_lokasi}")
                    ->searchable()
                    ->preload()
                    ->required(),

                Forms\Components\Textarea::make('alamat')
                    ->label('Alamat Lengkap')
                    ->rows(2)
                    ->columnSpanFull(),

                Forms\Components\Select::make('status')
                    ->label('Status Hak Pilih')
                    ->options([
                        'aktif' => 'Aktif (Memenuhi Syarat)',
                        'tms' => 'TMS (Tidak Memenuhi Syarat)',
                    ])
                    ->default('aktif')
                    ->required(),

                Forms\Components\TextInput::make('keterangan')
                    ->label('Keterangan Tambahan')
                    ->maxLength(255)
                    ->placeholder('Contoh: Pemilih Pemula / Meninggal'),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('nik')
                    ->label('NIK')
                    ->searchable()
                    ->sortable()
                    ->weight('bold')
                    ->copyable()
                    ->copyMessage('NIK berhasil disalin!'),

                Tables\Columns\TextColumn::make('nkk')
                    ->label('NKK')
                    ->searchable()
                    ->toggleable(isToggledHiddenByDefault: true),

                Tables\Columns\TextColumn::make('nama')
                    ->label('Nama Lengkap')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('jenis_kelamin')
                    ->label('JK')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'L' => 'info',
                        'P' => 'warning',
                        default => 'gray',
                    }),

                Tables\Columns\TextColumn::make('dusun')
                    ->label('Dusun / Banjar')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('tps.nomor_tps')
                    ->label('TPS')
                    ->badge()
                    ->color('success')
                    ->sortable()
                    ->searchable(),

                Tables\Columns\TextColumn::make('status')
                    ->label('Status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'aktif' => 'success',
                        'tms' => 'danger',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'aktif' => 'Aktif',
                        'tms' => 'TMS',
                        default => $state,
                    }),

                Tables\Columns\TextColumn::make('tanggal_lahir')
                    ->label('Tgl Lahir')
                    ->date('d M Y')
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('tps_id')
                    ->label('Filter TPS')
                    ->relationship('tps', 'nomor_tps'),

                Tables\Filters\SelectFilter::make('dusun')
                    ->label('Filter Dusun')
                    ->options(fn () => cache()->remember('voter_dusun_options', 600, fn () => Voter::whereNotNull('dusun')->distinct()->pluck('dusun', 'dusun')->toArray())),

                Tables\Filters\SelectFilter::make('status')
                    ->label('Status Pemilih')
                    ->options([
                        'aktif' => 'Aktif',
                        'tms' => 'Tidak Memenuhi Syarat (TMS)',
                    ]),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make()
                    ->visible(fn () => auth()->user()?->isAdmin()),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make()
                        ->visible(fn () => auth()->user()?->isAdmin()),
                ]),
            ])
            ->defaultSort('nama', 'asc');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListVoters::route('/'),
            'create' => Pages\CreateVoters::route('/create'),
            'edit' => Pages\EditVoters::route('/{record}/edit'),
        ];
    }
}
